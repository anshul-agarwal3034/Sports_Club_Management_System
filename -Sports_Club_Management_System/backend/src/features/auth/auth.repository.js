const { query } = require('../../shared/database/db');

class AuthRepository {
  /**
   * Find a user by their email address
   */
  async findByEmail(email) {
    const res = await query(
      `SELECT id, club_id, role, full_name, email, password_hash, phone, date_of_birth, guardian_id, points_balance, credit_limit, current_pay_later_balance, status, created_at 
       FROM users 
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return res.rows[0] || null;
  }

  /**
   * Find a user by ID
   */
  async findById(id) {
    const res = await query(
      `SELECT id, club_id, role, full_name, email, phone, date_of_birth, guardian_id, points_balance, credit_limit, current_pay_later_balance, status, created_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Create a new user record in the database
   */
  async createUser(userData) {
    const {
      clubId,
      role,
      fullName,
      email,
      passwordHash,
      phone,
      dateOfBirth,
      guardianId,
      creditLimit = 0.00,
      status = 'APPROVED',
    } = userData;

    const res = await query(
      `INSERT INTO users (club_id, role, full_name, email, password_hash, phone, date_of_birth, guardian_id, credit_limit, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, club_id, role, full_name, email, phone, date_of_birth, guardian_id, points_balance, credit_limit, status, created_at`,
      [
        clubId || null,
        role,
        fullName,
        email,
        passwordHash,
        phone || null,
        dateOfBirth || null,
        guardianId || null,
        creditLimit,
        status,
      ]
    );
    return res.rows[0];
  }

  /**
   * Check if a club exists
   */
  async findClubById(clubId) {
    const res = await query(`SELECT id, name, is_verified FROM clubs WHERE id = $1`, [clubId]);
    return res.rows[0] || null;
  }

  /**
   * Create referral coupon entry
   */
  async createReferral(referrerId, referredUserId, couponCode) {
    const res = await query(
      `INSERT INTO referrals (referrer_id, referred_user_id, coupon_code)
       VALUES ($1, $2, $3)
       RETURNING id, coupon_code, friend_discount_pct, is_reward_released`,
      [referrerId, referredUserId, couponCode]
    );
    return res.rows[0];
  }
}

module.exports = new AuthRepository();
