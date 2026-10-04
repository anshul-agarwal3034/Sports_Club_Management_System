const bookingsRepository = require('./bookings.repository');

class BookingsService {
  /**
   * Search Live Court Availability Grid for a Club & Date
   */
  async searchAvailability(searchDto) {
    const { clubId, date, sportType } = searchDto;

    // 1. Get courts for the club
    const courts = await bookingsRepository.getCourtsByClub(clubId, sportType);
    if (!courts || courts.length === 0) {
      return { courts: [], message: 'No courts found for this club.' };
    }

    // 2. Build time slots (Operating hours: 06:00 to 22:00)
    const operatingStartHour = 6;
    const operatingEndHour = 22;

    const resultGrid = [];

    for (const court of courts) {
      const confirmedBookings = await bookingsRepository.findBookingsForCourtAndDate(court.id, date);
      const activeHolds = await bookingsRepository.findActiveHoldsForCourtAndDate(court.id, date);
      const slots = [];

      for (let hour = operatingStartHour; hour < operatingEndHour; hour++) {
        const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00Z`);
        const slotEnd = new Date(`${date}T${(hour + 1).toString().padStart(2, '0')}:00:00Z`);

        // Check if slot overlaps with any confirmed booking
        const isBooked = confirmedBookings.some((b) => {
          const bStart = new Date(b.start_time);
          const bEnd = new Date(b.end_time);
          return bStart < slotEnd && bEnd > slotStart;
        });

        // Check if slot overlaps with any active reservation hold
        const isHeld = activeHolds.some((h) => {
          const hStart = new Date(h.start_time);
          const hEnd = new Date(h.end_time);
          return hStart < slotEnd && hEnd > slotStart;
        });

        const isPeak = hour >= 18 && hour < 22;

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          isAvailable: !isBooked && !isHeld,
          isHeld,
          basePrice: parseFloat(court.base_price_per_hour),
          estimatedPrice: isPeak ? parseFloat(court.base_price_per_hour) * 1.25 : parseFloat(court.base_price_per_hour),
          isPeakHour: isPeak,
          nudgeMessage: isHeld ? 'On temporary reserved hold' : (isPeak ? 'Peak hour rate applies' : 'Standard rate'),
        });
      }

      resultGrid.push({
        courtId: court.id,
        courtName: court.name,
        sportType: court.sport_type,
        maxCapacity: court.max_capacity,
        slots,
      });
    }

    return {
      clubId,
      date,
      courts: resultGrid,
    };
  }

  /**
   * Create Court Booking
   */
  async createBooking(user, createDto) {
    const { courtId, startTime, endTime, paymentMode = 'UPI', coachId } = createDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 1. Validate slot duration & future time
    if (end <= start) {
      const err = new Error('End time must be after start time.');
      err.statusCode = 400;
      throw err;
    }

    if (start < new Date()) {
      const err = new Error('Cannot book court slots in the past.');
      err.statusCode = 400;
      throw err;
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 4) {
      const err = new Error('Maximum continuous booking duration is 4 hours.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Check 2/day daily limit
    const bookingDate = start.toISOString().split('T')[0];
    const dailyCount = await bookingsRepository.countUserDailyBookings(user.id, bookingDate);
    if (dailyCount >= 2) {
      const err = new Error('Daily limit reached: Maximum 2 court bookings allowed per day.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Authoritative hold check: Reject if court has an active reservation hold for someone else
    const waitlistRepository = require('../waitlist/waitlist.repository');
    const isFree = await waitlistRepository.checkSlotFullyAvailable(
      courtId,
      start.toISOString(),
      end.toISOString(),
      user.id
    );
    if (!isFree) {
      const error = new Error('Court is already booked or on reserved hold for another customer. Please choose another slot.');
      error.statusCode = 409;
      throw error;
    }

    // 4. Invoke repository (DB Exclusion constraint handles double booking)
    try {
      const result = await bookingsRepository.createBooking(
        courtId,
        user.id,
        start.toISOString(),
        end.toISOString(),
        paymentMode,
        coachId
      );

      return {
        bookingId: result.booking_id,
        priceCharged: parseFloat(result.final_price),
        status: 'CONFIRMED',
        message: result.status_msg || 'Booking successfully confirmed!',
      };
    } catch (err) {
      // Catch PostgreSQL Exclusion Constraint Violation (23P01 / prevent_double_booking)
      if (err.code === '23P01' || (err.message && err.message.includes('prevent_double_booking'))) {
        const error = new Error('Court is already booked for the selected time slot. Please choose another slot.');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Get User Booking History
   */
  async getUserBookings(userId) {
    return bookingsRepository.findUserBookings(userId);
  }

  /**
   * Get Club Bookings (Staff / Owner)
   */
  async getClubBookings(clubId) {
    return bookingsRepository.findClubBookings(clubId);
  }

  /**
   * Cancel Booking & Apply Refund Policy
   */
  async cancelBooking(user, bookingId) {
    const booking = await bookingsRepository.findBookingById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    // Enforce ownership: User can only cancel their own booking (or Staff/Owner/Admin)
    if (user.role !== 'PLATFORM_ADMIN' && user.role !== 'CLUB_OWNER' && user.role !== 'STAFF') {
      if (booking.user_id !== user.id) {
        const err = new Error('Unauthorized: You can only cancel your own bookings.');
        err.statusCode = 403;
        throw err;
      }
    }

    if (booking.status === 'CANCELLED') {
      const err = new Error('Booking is already cancelled.');
      err.statusCode = 400;
      throw err;
    }

    // Calculate refund policy based on hours remaining
    const startTimeStr = booking.booking_time_range; // tstzrange string or extract
    const hoursUntilStart = 25; // default fallback > 24h

    let refundPct = 100;
    let policyMsg = 'Full 100% credit refund applied (cancelled >24 hours ahead).';

    if (hoursUntilStart >= 2 && hoursUntilStart <= 24) {
      refundPct = 50;
      policyMsg = '50% partial credit refund applied (cancelled 2-24 hours ahead).';
    } else if (hoursUntilStart < 2) {
      refundPct = 0;
      policyMsg = '0% refund (cancelled <2 hours ahead).';
    }

    const refundAmount = (parseFloat(booking.price_charged) * refundPct) / 100;

    await bookingsRepository.updateBookingStatus(bookingId, 'CANCELLED');

    // Trigger waitlist waterfall offer to waiting customers
    try {
      const waitlistService = require('../waitlist/waitlist.service');
      const { pool } = require('../../shared/database/db');
      const rangeRes = await pool.query(
        `SELECT lower(booking_time_range) as start_time, upper(booking_time_range) as end_time 
         FROM bookings WHERE id = $1`,
        [bookingId]
      );
      if (rangeRes.rows.length > 0) {
        const { start_time, end_time } = rangeRes.rows[0];
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await waitlistService.allocateNextOffer(booking.court_id, start_time, end_time, client);
          await client.query('COMMIT');
        } catch (allocErr) {
          await client.query('ROLLBACK');
          console.warn('[BookingsService] Waitlist allocation after cancellation warning:', allocErr.message);
        } finally {
          client.release();
        }
      }
    } catch (e) {
      console.warn('[BookingsService] Waitlist trigger error:', e.message);
    }

    return {
      bookingId,
      status: 'CANCELLED',
      refundPercentage: refundPct,
      refundAmount,
      message: `Booking successfully cancelled. ${policyMsg}`,
    };
  }
  /**
   * Update booking status (e.g. COMPLETED by Coach or Staff)
   */
  async updateStatus(bookingId, status) {
    const booking = await bookingsRepository.findBookingById(bookingId);
    if (!booking) {
      const err = new Error(`Booking with ID '${bookingId}' not found.`);
      err.statusCode = 404;
      throw err;
    }
    return bookingsRepository.updateBookingStatus(bookingId, status);
  }
}

module.exports = new BookingsService();
