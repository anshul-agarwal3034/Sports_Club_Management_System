const { pool } = require('../../shared/database/db');
const waitlistRepository = require('./waitlist.repository');
const bookingsRepository = require('../bookings/bookings.repository');
const notificationsService = require('../notifications/notifications.service');

class WaitlistService {
  /**
   * Customer joins waitlist for a specific court and time range
   */
  async joinWaitlist(user, joinDto) {
    const { clubId, courtId, startTime, endTime } = joinDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      const err = new Error('End time must be after start time.');
      err.statusCode = 400;
      throw err;
    }

    if (start <= new Date()) {
      const err = new Error('Cannot join waitlist for past or current time slots.');
      err.statusCode = 400;
      throw err;
    }

    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 30 || durationMinutes > 240) {
      const err = new Error('Waitlist slot duration must be between 30 minutes and 4 hours.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify court belongs to club
    const courts = await bookingsRepository.getCourtsByClub(clubId);
    const court = courts.find((c) => c.id === courtId);
    if (!court) {
      const err = new Error('Court not found or does not belong to specified club.');
      err.statusCode = 404;
      throw err;
    }

    // 2. Check 2/day daily booking limit upfront
    const bookingDate = start.toISOString().split('T')[0];
    const dailyCount = await bookingsRepository.countUserDailyBookings(user.id, bookingDate);
    if (dailyCount >= 2) {
      const err = new Error('Daily booking limit reached (2 per day). Cannot join waitlist.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Junior eligibility check: Juniors (<18 or tier JUNIOR) must have guardian or adhere to hours
    if (user.role === 'MEMBER') {
      const memberRes = await pool.query(
        `SELECT mp.tier, u.guardian_id, u.date_of_birth 
         FROM users u
         LEFT JOIN user_memberships um ON u.id = um.user_id AND um.club_id = $1 AND um.is_active = TRUE
         LEFT JOIN membership_plans mp ON um.plan_id = mp.id
         WHERE u.id = $2 LIMIT 1`,
        [clubId, user.id]
      );
      if (memberRes.rows.length > 0 && memberRes.rows[0].tier === 'JUNIOR') {
        const hour = start.getUTCHours();
        // Junior restriction: e.g. after 20:00 (8 PM) requires guardian
        if (hour >= 20 && !memberRes.rows[0].guardian_id) {
          const err = new Error('Junior members booking slots after 8:00 PM require a registered guardian.');
          err.statusCode = 400;
          throw err;
        }
      }
    }

    // 4. Check duplicate active waitlist entry
    const existing = await waitlistRepository.findActiveWaitlistEntry(
      courtId,
      start.toISOString(),
      end.toISOString(),
      user.id
    );
    if (existing) {
      const err = new Error('You already have an active waitlist entry for this court and time.');
      err.statusCode = 409;
      throw err;
    }

    // 5. Insert waitlist record
    const entry = await waitlistRepository.createWaitlistEntry(
      clubId,
      courtId,
      user.id,
      start.toISOString(),
      end.toISOString()
    );

    // 6. Check queue position
    const userEntries = await waitlistRepository.findUserWaitlist(user.id);
    const createdItem = userEntries.find((e) => e.id === entry.id);

    return {
      waitlistId: entry.id,
      courtId: entry.court_id,
      desiredTimeRange: entry.desired_time_range,
      status: entry.status,
      queuePosition: createdItem ? parseInt(createdItem.queue_position, 10) : 1,
      message: 'Successfully joined waitlist. You will be notified automatically if this slot opens.',
    };
  }

  /**
   * Leave / Cancel waitlist entry
   */
  async leaveWaitlist(user, waitlistId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const entry = await waitlistRepository.findById(waitlistId, true, client);
      if (!entry) {
        const err = new Error('Waitlist entry not found.');
        err.statusCode = 404;
        throw err;
      }

      if (entry.user_id !== user.id && user.role !== 'PLATFORM_ADMIN') {
        const err = new Error('Unauthorized to cancel this waitlist entry.');
        err.statusCode = 403;
        throw err;
      }

      if (entry.status === 'CANCELLED' || entry.status === 'DECLINED' || entry.status === 'EXPIRED') {
        await client.query('COMMIT');
        return { message: 'Waitlist entry is already inactive.', status: entry.status };
      }

      const hadActiveHold = (entry.status === 'OFFERED' || entry.status === 'PAYMENT_HOLD') && entry.reservation_hold_id;

      await waitlistRepository.updateStatus(waitlistId, 'CANCELLED', null, null, client);

      if (hadActiveHold) {
        await waitlistRepository.releaseReservationHold(entry.reservation_hold_id, client);
        // Waterfall offer to next eligible waiting candidate
        const rangeRes = await client.query(
          `SELECT lower(desired_time_range) as start_time, upper(desired_time_range) as end_time 
           FROM slot_waitlist WHERE id = $1`,
          [waitlistId]
        );
        if (rangeRes.rows.length > 0) {
          const { start_time, end_time } = rangeRes.rows[0];
          await this.allocateNextOffer(entry.court_id, start_time, end_time, client);
        }
      }

      await client.query('COMMIT');
      return { message: 'Successfully left the waitlist.', status: 'CANCELLED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Waterfall Allocation: Deterministically finds next eligible waiting candidate
   * Verifies that the candidate's entire requested duration is completely free of bookings & holds
   */
  async allocateNextOffer(courtId, availableStart, availableEnd, client) {
    const candidates = await waitlistRepository.findNextWaitingCandidate(
      courtId,
      availableStart,
      availableEnd,
      client
    );

    for (const candidate of candidates) {
      // 1. Extract requested time range
      const rangeRes = await client.query(
        `SELECT lower(desired_time_range) as start_time, upper(desired_time_range) as end_time 
         FROM slot_waitlist WHERE id = $1`,
        [candidate.id]
      );
      const { start_time: candStart, end_time: candEnd } = rangeRes.rows[0];

      // 2. CRITICAL CORRECTNESS: Verify candidate's ENTIRE duration is available
      const isEntireDurationFree = await waitlistRepository.checkSlotFullyAvailable(
        courtId,
        candStart,
        candEnd,
        null,
        client
      );
      if (!isEntireDurationFree) {
        continue; // Candidate wants a duration that is partly obstructed by other bookings/holds
      }

      // 3. Recheck booking limit (2/day)
      const candDate = new Date(candStart).toISOString().split('T')[0];
      const countRes = await client.query(
        `SELECT COUNT(*) FROM bookings 
         WHERE user_id = $1 
           AND status = 'CONFIRMED'
           AND booking_time_range && tstzrange($2::timestamptz, ($2::date + INTERVAL '1 day')::timestamptz)`,
        [candidate.user_id, candDate]
      );
      if (parseInt(countRes.rows[0].count, 10) >= 2) {
        // Daily limit reached in the meantime -> mark skipped or continue
        continue;
      }

      // 4. Recheck time conflicts (candidate booked on another court at the same time)
      const conflictRes = await client.query(
        `SELECT id FROM bookings 
         WHERE user_id = $1 
           AND status = 'CONFIRMED'
           AND booking_time_range && tstzrange($2::timestamptz, $3::timestamptz)
         LIMIT 1`,
        [candidate.user_id, candStart, candEnd]
      );
      if (conflictRes.rows.length > 0) {
        continue;
      }

      // 5. Eligible candidate found! Compute deadline: 10 minutes from now, but capped before match start
      const now = new Date();
      const matchStart = new Date(candStart);
      const defaultExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
      const matchCutoff = new Date(matchStart.getTime() - 15 * 60 * 1000); // 15 mins before match
      const cappedDeadline = defaultExpiry < matchCutoff ? defaultExpiry : (matchCutoff > now ? matchCutoff : defaultExpiry);

      // 6. Create authoritative reservation hold
      const hold = await waitlistRepository.createReservationHold(
        candidate.club_id,
        courtId,
        candidate.user_id,
        candStart,
        candEnd,
        'WAITLIST_OFFER',
        cappedDeadline.toISOString(),
        candidate.id,
        client
      );

      // 7. Update candidate waitlist status to OFFERED
      await waitlistRepository.updateStatus(
        candidate.id,
        'OFFERED',
        hold.id,
        cappedDeadline.toISOString(),
        client
      );

      // 8. Safe notification dispatch (never breaks transaction)
      notificationsService.dispatchSafe({
        userId: candidate.user_id,
        clubId: candidate.club_id,
        type: 'WAITLIST_OFFER',
        title: 'Court Slot Available!',
        message: `A court slot has opened up for your waitlisted time! You have until ${cappedDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to claim it.`,
        payload: {
          waitlistId: candidate.id,
          courtId,
          startTime: candStart,
          endTime: candEnd,
          expiresAt: cappedDeadline.toISOString(),
        },
      });

      return {
        offeredToUserId: candidate.user_id,
        waitlistId: candidate.id,
        expiresAt: cappedDeadline.toISOString(),
      };
    }

    return null; // No eligible candidate found; slot remains publicly available
  }

  /**
   * Accept Waitlist Offer
   */
  async acceptOffer(user, waitlistId, paymentMode = 'UPI') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const entry = await waitlistRepository.findById(waitlistId, true, client);
      if (!entry) {
        const err = new Error('Waitlist entry not found.');
        err.statusCode = 404;
        throw err;
      }

      if (entry.user_id !== user.id) {
        const err = new Error('Unauthorized: This offer does not belong to you.');
        err.statusCode = 403;
        throw err;
      }

      // Idempotency: If already accepted, return success
      if (entry.status === 'ACCEPTED') {
        await client.query('COMMIT');
        return {
          status: 'ACCEPTED',
          message: 'Offer is already accepted and booking is confirmed.',
        };
      }

      if (entry.status !== 'OFFERED') {
        const err = new Error(`Cannot accept offer with status '${entry.status}'.`);
        err.statusCode = 400;
        throw err;
      }

      // SERVER TIME ENFORCEMENT: Check if offer has expired
      const now = new Date();
      const expiresAt = new Date(entry.offer_expires_at);
      if (now > expiresAt) {
        // Expire entry and release hold
        await waitlistRepository.updateStatus(waitlistId, 'EXPIRED', null, null, client);
        if (entry.reservation_hold_id) {
          await waitlistRepository.releaseReservationHold(entry.reservation_hold_id, client);
        }

        // Waterfall to next eligible candidate
        const rangeRes = await client.query(
          `SELECT lower(desired_time_range) as start_time, upper(desired_time_range) as end_time 
           FROM slot_waitlist WHERE id = $1`,
          [waitlistId]
        );
        if (rangeRes.rows.length > 0) {
          const { start_time, end_time } = rangeRes.rows[0];
          await this.allocateNextOffer(entry.court_id, start_time, end_time, client);
        }

        await client.query('COMMIT');
        const err = new Error('Offer has expired. The slot has been offered to the next customer.');
        err.statusCode = 410;
        throw err;
      }

      // Extract time range
      const rangeRes = await client.query(
        `SELECT lower(desired_time_range) as start_time, upper(desired_time_range) as end_time 
         FROM slot_waitlist WHERE id = $1`,
        [waitlistId]
      );
      const { start_time, end_time } = rangeRes.rows[0];

      // Recheck daily booking limit
      const bookingDate = new Date(start_time).toISOString().split('T')[0];
      const countRes = await client.query(
        `SELECT COUNT(*) FROM bookings 
         WHERE user_id = $1 
           AND status = 'CONFIRMED'
           AND booking_time_range && tstzrange($2::timestamptz, ($2::date + INTERVAL '1 day')::timestamptz)`,
        [user.id, bookingDate]
      );
      if (parseInt(countRes.rows[0].count, 10) >= 2) {
        const err = new Error('Daily limit reached: Maximum 2 court bookings allowed per day.');
        err.statusCode = 400;
        throw err;
      }

      // Create authoritative confirmed booking
      const bookingRes = await client.query(
        `SELECT * FROM create_court_booking($1, $2, $3, $4, $5)`,
        [entry.court_id, user.id, start_time, end_time, paymentMode]
      );
      const booking = bookingRes.rows[0];

      // Mark reservation hold as CONVERTED
      if (entry.reservation_hold_id) {
        await waitlistRepository.convertReservationHold(entry.reservation_hold_id, client);
      }

      // Mark waitlist as ACCEPTED
      await waitlistRepository.updateStatus(waitlistId, 'ACCEPTED', null, null, client);

      await client.query('COMMIT');

      // Dispatch confirmation notification
      notificationsService.dispatchSafe({
        userId: user.id,
        clubId: entry.club_id,
        type: 'WAITLIST_OFFER',
        title: 'Booking Confirmed!',
        message: `Your waitlist offer was accepted. Booking #${booking.booking_id} is confirmed.`,
        payload: { bookingId: booking.booking_id },
      });

      return {
        bookingId: booking.booking_id,
        finalPrice: parseFloat(booking.final_price),
        status: 'CONFIRMED',
        message: 'Waitlist offer accepted and booking confirmed!',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Decline Waitlist Offer
   */
  async declineOffer(user, waitlistId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const entry = await waitlistRepository.findById(waitlistId, true, client);
      if (!entry) {
        const err = new Error('Waitlist entry not found.');
        err.statusCode = 404;
        throw err;
      }

      if (entry.user_id !== user.id) {
        const err = new Error('Unauthorized: This offer does not belong to you.');
        err.statusCode = 403;
        throw err;
      }

      if (entry.status === 'DECLINED') {
        await client.query('COMMIT');
        return { status: 'DECLINED', message: 'Offer is already declined.' };
      }

      // Release hold and update status
      if (entry.reservation_hold_id) {
        await waitlistRepository.releaseReservationHold(entry.reservation_hold_id, client);
      }
      await waitlistRepository.updateStatus(waitlistId, 'DECLINED', null, null, client);

      // Waterfall to next eligible candidate
      const rangeRes = await client.query(
        `SELECT lower(desired_time_range) as start_time, upper(desired_time_range) as end_time 
         FROM slot_waitlist WHERE id = $1`,
        [waitlistId]
      );
      if (rangeRes.rows.length > 0) {
        const { start_time, end_time } = rangeRes.rows[0];
        await this.allocateNextOffer(entry.court_id, start_time, end_time, client);
      }

      await client.query('COMMIT');
      return { status: 'DECLINED', message: 'Offer declined. The slot has been passed to the next customer.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's waitlist entries
   */
  async getUserWaitlist(userId) {
    return waitlistRepository.findUserWaitlist(userId);
  }

  /**
   * Sweeper Worker: Expire stale offers and waterfall to next in queue
   */
  async processExpiredOffers() {
    const client = await pool.connect();
    let processedCount = 0;
    try {
      await client.query('BEGIN');

      const expired = await waitlistRepository.findExpiredOffers(client);
      for (const entry of expired) {
        // Mark EXPIRED
        await waitlistRepository.updateStatus(entry.id, 'EXPIRED', null, null, client);
        if (entry.reservation_hold_id) {
          await waitlistRepository.releaseReservationHold(entry.reservation_hold_id, client);
        }

        // Waterfall to next candidate
        const rangeRes = await client.query(
          `SELECT lower(desired_time_range) as start_time, upper(desired_time_range) as end_time 
           FROM slot_waitlist WHERE id = $1`,
          [entry.id]
        );
        if (rangeRes.rows.length > 0) {
          const { start_time, end_time } = rangeRes.rows[0];
          await this.allocateNextOffer(entry.court_id, start_time, end_time, client);
        }

        // Notify user their offer expired
        notificationsService.dispatchSafe({
          userId: entry.user_id,
          clubId: entry.club_id,
          type: 'OFFER_EXPIRED',
          title: 'Waitlist Offer Expired',
          message: 'Your 10-minute window to accept the court slot has expired.',
          payload: { waitlistId: entry.id },
        });

        processedCount++;
      }

      await client.query('COMMIT');
      return { processedCount };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[WaitlistService] Error processing expired offers:', err);
      return { processedCount: 0, error: err.message };
    } finally {
      client.release();
    }
  }
}

module.exports = new WaitlistService();
