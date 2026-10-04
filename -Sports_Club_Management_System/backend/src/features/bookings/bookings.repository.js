const { query } = require('../../shared/database/db');

class BookingsRepository {
  /**
   * Invoke DB procedure: calculate_booking_price
   */
  async calculatePrice(courtId, userId, startTime, endTime) {
    const res = await query(
      `SELECT calculate_booking_price($1, $2, $3, $4) as price`,
      [courtId, userId, startTime, endTime]
    );
    return parseFloat(res.rows[0].price);
  }

  /**
   * Invoke DB stored procedure: create_court_booking
   * Automatically locks price, checks 2/day cap, & inserts transaction
   */
  async createBooking(courtId, userId, startTime, endTime, paymentMode = 'UPI', coachId = null) {
    const res = await query(
      `SELECT * FROM create_court_booking($1, $2, $3, $4, $5, $6)`,
      [courtId, userId, startTime, endTime, paymentMode, coachId]
    );
    return res.rows[0];
  }

  /**
   * Get list of courts for a club
   */
  async getCourtsByClub(clubId, sportType = null) {
    let sql = `SELECT id, club_id, name, sport_type, base_price_per_hour, max_capacity FROM courts WHERE club_id = $1`;
    const params = [clubId];

    if (sportType) {
      sql += ` AND LOWER(sport_type) = LOWER($2)`;
      params.push(sportType);
    }

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Find confirmed bookings for a court on a specific date
   */
  async findBookingsForCourtAndDate(courtId, date) {
    const res = await query(
      `SELECT id, court_id, user_id, lower(booking_time_range) as start_time, upper(booking_time_range) as end_time, price_charged, status
       FROM bookings
       WHERE court_id = $1
         AND status = 'CONFIRMED'
         AND booking_time_range && tstzrange($2::timestamptz, ($2::date + INTERVAL '1 day')::timestamptz)`,
      [courtId, date]
    );
    return res.rows;
  }

  /**
   * Find active reservation holds for a court on a specific date
   */
  async findActiveHoldsForCourtAndDate(courtId, date) {
    const res = await query(
      `SELECT id, court_id, user_id, lower(slot_time_range) as start_time, upper(slot_time_range) as end_time, hold_type, expires_at
       FROM reservation_holds
       WHERE court_id = $1
         AND status = 'ACTIVE'
         AND expires_at > CURRENT_TIMESTAMP
         AND slot_time_range && tstzrange($2::timestamptz, ($2::date + INTERVAL '1 day')::timestamptz)`,
      [courtId, date]
    );
    return res.rows;
  }

  /**
   * Find booking by ID
   */
  async findBookingById(bookingId) {
    const res = await query(
      `SELECT b.id, b.club_id, b.court_id, b.user_id, b.booking_time_range, b.price_charged, b.status, b.created_at,
              c.name as court_name, c.sport_type
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       WHERE b.id = $1`,
      [bookingId]
    );
    return res.rows[0] || null;
  }

  /**
   * Get all bookings for a user
   */
  async findUserBookings(userId) {
    const res = await query(
      `SELECT b.id, b.club_id, b.court_id, b.booking_time_range, b.price_charged, b.status, b.created_at,
              lower(b.booking_time_range) as start_time, upper(b.booking_time_range) as end_time,
              c.name as court_name, c.sport_type, cl.name as club_name
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       JOIN clubs cl ON b.club_id = cl.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  /**
   * Get all bookings for a club (Owner / Staff view)
   */
  async findClubBookings(clubId) {
    const res = await query(
      `SELECT b.id, b.court_id, b.user_id, b.booking_time_range, b.price_charged, b.status, b.created_at,
              c.name as court_name, c.sport_type, u.full_name as user_name, u.email as user_email
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       JOIN users u ON b.user_id = u.id
       WHERE b.club_id = $1
       ORDER BY b.created_at DESC`,
      [clubId]
    );
    return res.rows;
  }

  /**
   * Update booking status (CANCELLED / COMPLETED)
   */
  async updateBookingStatus(bookingId, status) {
    const res = await query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, bookingId]
    );
    return res.rows[0];
  }

  /**
   * Count user's bookings for a specific date
   */
  async countUserDailyBookings(userId, date) {
    const res = await query(
      `SELECT COUNT(*)::INT as count
       FROM bookings
       WHERE user_id = $1
         AND status = 'CONFIRMED'
         AND booking_time_range && tstzrange($2::timestamptz, ($2::date + INTERVAL '1 day')::timestamptz)`,
      [userId, date]
    );
    return res.rows[0].count;
  }
}

module.exports = new BookingsRepository();
