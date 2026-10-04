const { pool } = require('../../shared/database/db');
const matchmakingRepository = require('./matchmaking.repository');
const bookingsRepository = require('../bookings/bookings.repository');
const notificationsService = require('../notifications/notifications.service');

class MatchmakingService {
  /**
   * Create a Match Lobby (Draft or attached to an existing confirmed booking)
   */
  async createLobby(user, lobbyDto) {
    const {
      clubId,
      courtId,
      bookingId,
      sportType,
      gameType = 'CASUAL',
      startTime,
      endTime,
      minSkillLevel = 1.0,
      maxSkillLevel = 5.0,
      totalCapacity = 4,
      paymentModel = 'HOST_PAID_SPONSORED', // 'HOST_PAID_SPONSORED', 'HOST_PAID_REIMBURSED', 'AUTO_SPLIT'
    } = lobbyDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      const err = new Error('End time must be after start time.');
      err.statusCode = 400;
      throw err;
    }

    if (start <= new Date()) {
      const err = new Error('Cannot create match lobby for past or current time slots.');
      err.statusCode = 400;
      throw err;
    }

    if (totalCapacity < 2 || totalCapacity > 10) {
      const err = new Error('Total capacity must be between 2 and 10 players.');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let courtTotalPrice = 0.0;
      let lobbyStatus = 'OPEN';
      let attachedBooking = null;

      // 1. If bookingId is provided, verify legitimate ownership
      if (bookingId) {
        attachedBooking = await bookingsRepository.findBookingById(bookingId);
        if (!attachedBooking) {
          const err = new Error('Specified booking was not found.');
          err.statusCode = 404;
          throw err;
        }

        if (attachedBooking.user_id !== user.id && user.role !== 'PLATFORM_ADMIN') {
          const err = new Error('Unauthorized: You can only attach match lobbies to your own confirmed bookings.');
          err.statusCode = 403;
          throw err;
        }

        if (attachedBooking.status !== 'CONFIRMED') {
          const err = new Error(`Cannot attach lobby to booking with status '${attachedBooking.status}'.`);
          err.statusCode = 400;
          throw err;
        }

        courtTotalPrice = parseFloat(attachedBooking.price_charged);
      } else {
        // Draft Lobby without booked court
        lobbyStatus = 'DRAFT';
      }

      // Calculate cost per player for AUTO_SPLIT
      const costPerPlayer =
        paymentModel === 'AUTO_SPLIT' && courtTotalPrice > 0
          ? Math.round((courtTotalPrice / totalCapacity) * 100) / 100
          : 0.0;

      // 2. Insert Lobby
      const lobby = await matchmakingRepository.createLobby(
        {
          clubId,
          courtId: courtId || (attachedBooking ? attachedBooking.court_id : null),
          bookingId: bookingId || null,
          hostUserId: user.id,
          sportType,
          gameType,
          matchStartTime: start.toISOString(),
          matchEndTime: end.toISOString(),
          minSkillLevel,
          maxSkillLevel,
          totalCapacity,
          paymentModel,
          courtTotalPrice,
          costPerPlayer,
          status: lobbyStatus,
        },
        client
      );

      // 3. Host is automatically Participant #1 and APPROVED (counts toward capacity)
      await matchmakingRepository.addParticipant(
        {
          matchId: lobby.id,
          userId: user.id,
          isHost: true,
          approvalStatus: 'APPROVED',
          paymentStatus: paymentModel === 'AUTO_SPLIT' ? 'PENDING_PAYMENT' : 'NOT_REQUIRED',
          shareAmount: costPerPlayer,
        },
        client
      );

      await client.query('COMMIT');

      return {
        lobbyId: lobby.id,
        status: lobby.status,
        courtReservationStatus: attachedBooking ? 'CONFIRMED' : 'NONE',
        courtReservationNotice: attachedBooking
          ? `Court reserved (${attachedBooking.court_name})`
          : 'Court not booked. Joining this lobby does not reserve a court.',
        totalCapacity,
        openSpots: totalCapacity - 1,
        costPerPlayer,
        message: 'Match lobby created successfully!',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Discover Open Match Lobbies
   */
  async findLobbies(filters) {
    return matchmakingRepository.findOpenLobbies(filters);
  }

  /**
   * Get single match lobby with participants and profile histories
   */
  async getLobbyDetails(lobbyId) {
    const lobby = await matchmakingRepository.findLobbyById(lobbyId);
    if (!lobby) {
      const err = new Error('Match lobby not found.');
      err.statusCode = 404;
      throw err;
    }

    const participants = await matchmakingRepository.getParticipants(lobbyId);
    const approvedCount = participants.filter((p) => p.approval_status === 'APPROVED').length;

    return {
      lobby,
      participants,
      courtReservationStatus: lobby.booking_id ? 'CONFIRMED' : 'NONE',
      courtReservationNotice: lobby.booking_id
        ? `Court reserved (${lobby.court_name})`
        : 'Court not booked. Joining this lobby does not reserve a court.',
      approvedCount,
      openSpots: Math.max(0, lobby.total_capacity - approvedCount),
    };
  }

  /**
   * Request to Join Match Lobby
   */
  async requestToJoin(user, lobbyId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lobby = await matchmakingRepository.findLobbyById(lobbyId, true, client);
      if (!lobby) {
        const err = new Error('Match lobby not found.');
        err.statusCode = 404;
        throw err;
      }

      if (lobby.status !== 'OPEN' && lobby.status !== 'DRAFT') {
        const err = new Error(`Cannot join lobby with status '${lobby.status}'.`);
        err.statusCode = 400;
        throw err;
      }

      if (lobby.host_user_id === user.id) {
        const err = new Error('You are the host of this match lobby.');
        err.statusCode = 400;
        throw err;
      }

      // Check existing participation
      const existing = await matchmakingRepository.findParticipant(lobbyId, user.id, true, client);
      if (existing) {
        if (existing.approval_status === 'APPROVED' || existing.approval_status === 'PENDING_APPROVAL') {
          const err = new Error('You already have an active join request or confirmed seat in this match.');
          err.statusCode = 409;
          throw err;
        }
      }

      // Check capacity
      const approvedCount = await matchmakingRepository.countApprovedParticipants(lobbyId, client);
      if (approvedCount >= lobby.total_capacity) {
        const err = new Error('This match lobby is already full.');
        err.statusCode = 400;
        throw err;
      }

      // Check daily booking limit
      const matchDate = new Date(lobby.match_start_time).toISOString().split('T')[0];
      const dailyCount = await bookingsRepository.countUserDailyBookings(user.id, matchDate);
      if (dailyCount >= 2) {
        const err = new Error('Daily limit reached: Maximum 2 court sessions allowed per day.');
        err.statusCode = 400;
        throw err;
      }

      // Add participant with PENDING_APPROVAL
      await matchmakingRepository.addParticipant(
        {
          matchId: lobby.id,
          userId: user.id,
          isHost: false,
          approvalStatus: 'PENDING_APPROVAL',
          paymentStatus: lobby.payment_model === 'AUTO_SPLIT' ? 'PENDING_PAYMENT' : 'NOT_REQUIRED',
          shareAmount: parseFloat(lobby.cost_per_player),
        },
        client
      );

      await client.query('COMMIT');

      // Notify host of join request
      notificationsService.dispatchSafe({
        userId: lobby.host_user_id,
        clubId: lobby.club_id,
        type: 'MATCH_JOIN_REQUEST',
        title: 'New Player Join Request',
        message: `${user.full_name || 'A player'} has requested to join your ${lobby.sport_type} match.`,
        payload: { matchId: lobby.id, requestingUserId: user.id },
      });

      return {
        matchId: lobby.id,
        approvalStatus: 'PENDING_APPROVAL',
        message: 'Join request sent to the host. You will be notified when accepted.',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Host Approves or Rejects a Participant
   */
  async reviewParticipant(hostUser, lobbyId, targetUserId, action) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lobby = await matchmakingRepository.findLobbyById(lobbyId, true, client);
      if (!lobby) {
        const err = new Error('Match lobby not found.');
        err.statusCode = 404;
        throw err;
      }

      if (lobby.host_user_id !== hostUser.id && hostUser.role !== 'PLATFORM_ADMIN') {
        const err = new Error('Unauthorized: Only the match host can approve or reject participants.');
        err.statusCode = 403;
        throw err;
      }

      const participant = await matchmakingRepository.findParticipant(lobbyId, targetUserId, true, client);
      if (!participant) {
        const err = new Error('Participant join request not found.');
        err.statusCode = 404;
        throw err;
      }

      if (action === 'REJECT') {
        await matchmakingRepository.updateParticipantStatus(lobbyId, targetUserId, 'REJECTED', null, client);
        await client.query('COMMIT');

        notificationsService.dispatchSafe({
          userId: targetUserId,
          clubId: lobby.club_id,
          type: 'MATCH_CANCELLED',
          title: 'Join Request Declined',
          message: `The host declined your join request for the ${lobby.sport_type} match.`,
          payload: { matchId: lobby.id },
        });

        return { message: 'Participant request rejected.', status: 'REJECTED' };
      }

      // Action is APPROVE -> Atomic capacity check
      const approvedCount = await matchmakingRepository.countApprovedParticipants(lobbyId, client);
      if (approvedCount >= lobby.total_capacity) {
        const err = new Error('Match lobby is already at maximum capacity.');
        err.statusCode = 400;
        throw err;
      }

      const initialPaymentStatus =
        lobby.payment_model === 'AUTO_SPLIT' ? 'PENDING_PAYMENT' : 'NOT_REQUIRED';

      await matchmakingRepository.updateParticipantStatus(
        lobbyId,
        targetUserId,
        'APPROVED',
        initialPaymentStatus,
        client
      );

      // Check if lobby is now FULL
      const newApprovedCount = approvedCount + 1;
      if (newApprovedCount >= lobby.total_capacity) {
        await matchmakingRepository.updateLobbyStatus(lobbyId, 'FULL', client);
      }

      await client.query('COMMIT');

      // Notify accepted player
      notificationsService.dispatchSafe({
        userId: targetUserId,
        clubId: lobby.club_id,
        type: 'MATCH_ACCEPTED',
        title: 'You are Approved to Play!',
        message: `The host approved your request for the ${lobby.sport_type} match! ${
          lobby.payment_model === 'AUTO_SPLIT'
            ? `Please complete your share payment of ₹${lobby.cost_per_player} to finalize your seat.`
            : 'Get ready to play!'
        }`,
        payload: { matchId: lobby.id, shareAmount: lobby.cost_per_player },
      });

      return {
        message: 'Participant successfully approved!',
        status: 'APPROVED',
        paymentStatus: initialPaymentStatus,
        shareAmount: lobby.cost_per_player,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Participant Completes Split Payment
   */
  async payParticipantShare(user, lobbyId, paymentDto = {}) {
    const { paymentMode = 'UPI' } = paymentDto;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lobby = await matchmakingRepository.findLobbyById(lobbyId, true, client);
      if (!lobby) {
        const err = new Error('Match lobby not found.');
        err.statusCode = 404;
        throw err;
      }

      const participant = await matchmakingRepository.findParticipant(lobbyId, user.id, true, client);
      if (!participant) {
        const err = new Error('You are not a participant in this match.');
        err.statusCode = 404;
        throw err;
      }

      if (participant.approval_status !== 'APPROVED') {
        const err = new Error('You must be approved by the host before completing payment.');
        err.statusCode = 400;
        throw err;
      }

      if (participant.payment_status === 'PAID') {
        await client.query('COMMIT');
        return { message: 'Share payment already completed.', status: 'PAID' };
      }

      const amountToPay = parseFloat(participant.share_amount || lobby.cost_per_player);

      // Record in dedicated match_payments ledger (not club financial ledger)
      const txnRef = `TXN_MATCH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await matchmakingRepository.recordPayment(
        {
          matchId: lobby.id,
          participantId: participant.id,
          userId: user.id,
          amount: amountToPay,
          paymentMode,
          paymentStatus: 'SUCCESS',
          reference: txnRef,
          refundReason: null,
        },
        client
      );

      // Update participant payment status
      await client.query(
        `UPDATE match_participants 
         SET payment_status = 'PAID', paid_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [participant.id]
      );

      await client.query('COMMIT');

      return {
        matchId: lobby.id,
        amountPaid: amountToPay,
        paymentStatus: 'PAID',
        transactionReference: txnRef,
        message: 'Share payment successfully recorded and seat finalized!',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Participant Withdraws from Match
   */
  async withdrawParticipant(user, lobbyId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lobby = await matchmakingRepository.findLobbyById(lobbyId, true, client);
      if (!lobby) {
        const err = new Error('Match lobby not found.');
        err.statusCode = 404;
        throw err;
      }

      const participant = await matchmakingRepository.findParticipant(lobbyId, user.id, true, client);
      if (!participant) {
        const err = new Error('You are not registered in this match.');
        err.statusCode = 404;
        throw err;
      }

      if (participant.is_host) {
        const err = new Error('Host cannot withdraw. Please cancel the lobby instead.');
        err.statusCode = 400;
        throw err;
      }

      // If user had paid, record refund record
      if (participant.payment_status === 'PAID') {
        await matchmakingRepository.recordPayment(
          {
            matchId: lobby.id,
            participantId: participant.id,
            userId: user.id,
            amount: parseFloat(participant.share_amount),
            paymentMode: 'UPI',
            paymentStatus: 'REFUNDED',
            reference: `REFUND_${Date.now()}`,
            refundReason: 'Player voluntary withdrawal before match start',
          },
          client
        );
      }

      await matchmakingRepository.updateParticipantStatus(lobbyId, user.id, 'WITHDRAWN', 'REFUNDED', client);

      // If lobby was FULL, re-open it to OPEN
      if (lobby.status === 'FULL') {
        await matchmakingRepository.updateLobbyStatus(lobbyId, 'OPEN', client);
      }

      await client.query('COMMIT');

      // Notify host of withdrawal
      notificationsService.dispatchSafe({
        userId: lobby.host_user_id,
        clubId: lobby.club_id,
        type: 'MATCH_CANCELLED',
        title: 'Player Withdrew',
        message: `${user.full_name || 'A player'} withdrew from your ${lobby.sport_type} match. A spot is now open.`,
        payload: { matchId: lobby.id },
      });

      return { message: 'Successfully withdrawn from match.', status: 'WITHDRAWN' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Host Cancels Match Lobby (Processes automatic refunds for paying participants)
   */
  async cancelLobby(hostUser, lobbyId, reason = 'Cancelled by host') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lobby = await matchmakingRepository.findLobbyById(lobbyId, true, client);
      if (!lobby) {
        const err = new Error('Match lobby not found.');
        err.statusCode = 404;
        throw err;
      }

      if (lobby.host_user_id !== hostUser.id && hostUser.role !== 'PLATFORM_ADMIN') {
        const err = new Error('Unauthorized: Only the host can cancel this match lobby.');
        err.statusCode = 403;
        throw err;
      }

      // Mark lobby CANCELLED
      await matchmakingRepository.updateLobbyStatus(lobbyId, 'CANCELLED', client);

      // Get participants to process refunds
      const participants = await matchmakingRepository.getParticipants(lobbyId, client);
      for (const p of participants) {
        if (!p.is_host && p.payment_status === 'PAID') {
          await matchmakingRepository.recordPayment(
            {
              matchId: lobby.id,
              participantId: p.id,
              userId: p.user_id,
              amount: parseFloat(p.share_amount),
              paymentMode: 'UPI',
              paymentStatus: 'REFUNDED',
              reference: `REFUND_HOST_CANCEL_${Date.now()}`,
              refundReason: reason,
            },
            client
          );
        }

        if (!p.is_host) {
          notificationsService.dispatchSafe({
            userId: p.user_id,
            clubId: lobby.club_id,
            type: 'MATCH_CANCELLED',
            title: 'Match Cancelled by Host',
            message: `The ${lobby.sport_type} match was cancelled. Any paid share has been fully refunded.`,
            payload: { matchId: lobby.id, reason },
          });
        }
      }

      await client.query('COMMIT');
      return { message: 'Match lobby cancelled and all player refunds processed.', status: 'CANCELLED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update Self-Assessed Rating for a Sport
   */
  async updateSelfRating(userId, sportType, selfRating) {
    if (selfRating < 1.0 || selfRating > 7.0) {
      const err = new Error('Self rating must be between 1.0 and 7.0.');
      err.statusCode = 400;
      throw err;
    }
    return matchmakingRepository.upsertPlayerRating(userId, sportType, selfRating);
  }

  /**
   * Record No-Show (Increments count truthfully without fabricating ratings)
   */
  async recordNoShow(staffOrHost, lobbyId, targetUserId) {
    const lobby = await matchmakingRepository.findLobbyById(lobbyId);
    if (!lobby) {
      const err = new Error('Match lobby not found.');
      err.statusCode = 404;
      throw err;
    }

    if (lobby.host_user_id !== staffOrHost.id && staffOrHost.role !== 'STAFF' && staffOrHost.role !== 'PLATFORM_ADMIN') {
      const err = new Error('Unauthorized to record no-show.');
      err.statusCode = 403;
      throw err;
    }

    await matchmakingRepository.updateParticipantStatus(lobbyId, targetUserId, 'NO_SHOW', null);
    await matchmakingRepository.incrementNoShow(targetUserId, lobby.sport_type);

    return { message: 'No-show recorded successfully.', userId: targetUserId };
  }
}

module.exports = new MatchmakingService();
