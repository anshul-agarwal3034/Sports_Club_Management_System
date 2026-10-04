const { query, pool } = require('../../shared/database/db');

class WaitlistRepository {
  /**
   * Check if a specific slot duration has any confirmed bookings OR active holds
   */
  async checkSlotFullyAvailable(courtId, startTime, endTime, excludeUserId = null, client = null) {
    const db = client || pool;
    // 1. Check confirmed bookings overlapping the range
    const bookingRes = await db.query(
      `SELECT id FROM bookings 
       WHERE court_id = $1 
         AND status = 'CONFIRMED' 
         AND booking_time_range && tstzrange($2::timestamptz, $3::timestamptz)
       LIMIT 1`,
      [courtId, startTime, endTime]
    );
    if (bookingRes.rows.length > 0) {
      return false;
    }

    // 2. Check active reservation holds overlapping the range (exclude holds belonging to excludeUserId)
    let holdSql = `
      SELECT id FROM reservation_holds
      WHERE court_id = $1
        AND status = 'ACTIVE'
        AND expires_at > CURRENT_TIMESTAMP
        AND slot_time_range && tstzrange($2::timestamptz, $3::timestamptz)
    `;
    const holdParams = [courtId, startTime, endTime];
    if (excludeUserId) {
      holdSql += ` AND user_id != $4`;
      holdParams.push(excludeUserId);
    }
    holdSql += ` LIMIT 1`;

    const holdRes = await db.query(holdSql, holdParams);
    if (holdRes.rows.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * Find active reservation hold for a slot
   */
  async findActiveHoldForSlot(courtId, startTime, endTime) {
    const res = await query(
      `SELECT * FROM reservation_holds
       WHERE court_id = $1
         AND status = 'ACTIVE'
         AND expires_at > CURRENT_TIMESTAMP
         AND slot_time_range && tstzrange($2::timestamptz, $3::timestamptz)
       ORDER BY expires_at DESC
       LIMIT 1`,
      [courtId, startTime, endTime]
    );
    return res.rows[0] || null;
  }

  /**
   * Create an authoritative reservation hold
   */
  async createReservationHold(clubId, courtId, userId, startTime, endTime, holdType, expiresAt, refId = null, client = null) {
    const db = client || pool;
    const res = await db.query(
      `INSERT INTO reservation_holds (
        club_id, court_id, user_id, slot_time_range, hold_type, status, expires_at, reference_id
      ) VALUES ($1, $2, $3, tstzrange($4::timestamptz, $5::timestamptz), $6, 'ACTIVE', $7, $8)
      RETURNING *`,
      [clubId, courtId, userId, startTime, endTime, holdType, expiresAt, refId]
    );
    return res.rows[0];
  }

  /**
   * Release hold
   */
  async releaseReservationHold(holdId, client = null) {
    const db = client || pool;
    const res = await db.query(
      `UPDATE reservation_holds 
       SET status = 'RELEASED' 
       WHERE id = $1 AND status = 'ACTIVE' 
       RETURNING *`,
      [holdId]
    );
    return res.rows[0] || null;
  }

  /**
   * Convert hold to confirmed booking
   */
  async convertReservationHold(holdId, client = null) {
    const db = client || pool;
    const res = await db.query(
      `UPDATE reservation_holds 
       SET status = 'CONVERTED' 
       WHERE id = $1 
       RETURNING *`,
      [holdId]
    );
    return res.rows[0] || null;
  }

  /**
   * Insert new waitlist entry
   */
  async createWaitlistEntry(clubId, courtId, userId, startTime, endTime) {
    const res = await query(
      `INSERT INTO slot_waitlist (
        club_id, court_id, user_id, desired_time_range, status
      ) VALUES ($1, $2, $3, tstzrange($4::timestamptz, $5::timestamptz), 'WAITING')
      RETURNING *`,
      [clubId, courtId, userId, startTime, endTime]
    );
    return res.rows[0];
  }

  /**
   * Find active waitlist entry for a user on specific court and time
   */
  async findActiveWaitlistEntry(courtId, startTime, endTime, userId) {
    const res = await query(
      `SELECT * FROM slot_waitlist
       WHERE court_id = $1
         AND user_id = $2
         AND desired_time_range = tstzrange($3::timestamptz, $4::timestamptz)
         AND status IN ('WAITING', 'OFFERED', 'PAYMENT_HOLD')
       LIMIT 1`,
      [courtId, userId, startTime, endTime]
    );
    return res.rows[0] || null;
  }

  /**
   * Find waitlist entry by ID (optionally with client for transaction & locking)
   */
  async findById(waitlistId, forUpdate = false, client = null) {
    const db = client || pool;
    let sql = `
      SELECT w.*, c.name as court_name, c.sport_type, c.base_price_per_hour, cl.name as club_name, u.full_name, u.email
      FROM slot_waitlist w
      JOIN courts c ON w.court_id = c.id
      JOIN clubs cl ON w.club_id = cl.id
      JOIN users u ON w.user_id = u.id
      WHERE w.id = $1
    `;
    if (forUpdate) {
      sql += ` FOR UPDATE OF w`;
    }
    const res = await db.query(sql, [waitlistId]);
    return res.rows[0] || null;
  }

  /**
   * Get all waitlist entries for a user with relative queue position
   */
  async findUserWaitlist(userId) {
    const res = await query(
      `SELECT w.id, w.club_id, w.court_id, w.desired_time_range, w.status, w.offer_expires_at, w.created_at,
              c.name as court_name, c.sport_type, cl.name as club_name,
              (
                SELECT COUNT(*) + 1 
                FROM slot_waitlist w2 
                WHERE w2.court_id = w.court_id 
                  AND w2.desired_time_range && w.desired_time_range
                  AND w2.status = 'WAITING'
                  AND (w2.created_at < w.created_at OR (w2.created_at = w.created_at AND w2.id < w.id))
              ) as queue_position
       FROM slot_waitlist w
       JOIN courts c ON w.court_id = c.id
       JOIN clubs cl ON w.club_id = cl.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  /**
   * Find next waiting candidate for a court and time range (deterministic FIFO: created_at ASC, id ASC)
   * Using FOR UPDATE SKIP LOCKED to prevent concurrent worker conflicts
   */
  async findNextWaitingCandidate(courtId, startTime, endTime, client) {
    const res = await client.query(
      `SELECT w.*, u.role, u.date_of_birth
       FROM slot_waitlist w
       JOIN users u ON w.user_id = u.id
       WHERE w.court_id = $1
         AND w.desired_time_range && tstzrange($2::timestamptz, $3::timestamptz)
         AND w.status = 'WAITING'
       ORDER BY w.created_at ASC, w.id ASC
       FOR UPDATE OF w SKIP LOCKED`,
      [courtId, startTime, endTime]
    );
    return res.rows;
  }

  /**
   * Update waitlist status
   */
  async updateStatus(waitlistId, status, holdId = null, offerExpiresAt = null, client = null) {
    const db = client || pool;
    const res = await db.query(
      `UPDATE slot_waitlist
       SET status = $1,
           reservation_hold_id = COALESCE($2, reservation_hold_id),
           offer_expires_at = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, holdId, offerExpiresAt, waitlistId]
    );
    return res.rows[0];
  }

  /**
   * Find expired offers across the platform
   */
  async findExpiredOffers(client = null) {
    const db = client || pool;
    const res = await db.query(
      `SELECT w.*, c.club_id, c.sport_type
       FROM slot_waitlist w
       JOIN courts c ON w.court_id = c.id
       WHERE w.status = 'OFFERED'
         AND w.offer_expires_at <= CURRENT_TIMESTAMP
       ORDER BY w.offer_expires_at ASC
       FOR UPDATE OF w SKIP LOCKED`
    );
    return res.rows;
  }
}

module.exports = new WaitlistRepository();
