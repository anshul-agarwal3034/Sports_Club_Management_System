const { query } = require('../../shared/database/db');

class MembershipsRepository {
  /**
   * Get all active membership plans for a club
   */
  async findPlansByClub(clubId) {
    const res = await query(
      `SELECT id, club_id, tier, price, duration_months, court_discount_pct, rental_discount_pct, 
              shop_discount_pct, food_discount_pct, allows_pay_later, free_coaching_sessions_per_month, created_at
       FROM membership_plans
       WHERE club_id = $1
       ORDER BY price DESC`,
      [clubId]
    );
    return res.rows;
  }

  /**
   * Find membership plan by ID
   */
  async findPlanById(planId) {
    const res = await query(
      `SELECT id, club_id, tier, price, duration_months, court_discount_pct, rental_discount_pct, 
              shop_discount_pct, food_discount_pct, allows_pay_later, free_coaching_sessions_per_month
       FROM membership_plans
       WHERE id = $1`,
      [planId]
    );
    return res.rows[0] || null;
  }

  /**
   * Invoke PostgreSQL stored procedure: purchase_membership
   * Handles 15-day grace period addition, role update, Gold credit limit & referral processing
   */
  async purchaseMembership(userId, planId, paymentMode = 'UPI', referralCode = null) {
    const res = await query(
      `SELECT * FROM purchase_membership($1, $2, $3, $4)`,
      [userId, planId, paymentMode, referralCode]
    );
    return res.rows[0];
  }

  /**
   * Find active membership for a user
   */
  async findActiveUserMembership(userId) {
    const res = await query(
      `SELECT um.id, um.user_id, um.plan_id, um.club_id, um.start_date, um.expiry_date, 
              um.grace_days_added, um.is_active, um.created_at,
              mp.tier, mp.price, mp.court_discount_pct, mp.rental_discount_pct, mp.shop_discount_pct,
              mp.allows_pay_later, mp.free_coaching_sessions_per_month,
              c.name as club_name
       FROM user_memberships um
       JOIN membership_plans mp ON um.plan_id = mp.id
       JOIN clubs c ON um.club_id = c.id
       WHERE um.user_id = $1 AND um.is_active = TRUE
       LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Validate referral coupon code
   */
  async findReferralByCode(couponCode) {
    const res = await query(
      `SELECT id, referrer_id, referred_user_id, coupon_code, friend_discount_pct, is_reward_released
       FROM referrals
       WHERE coupon_code = $1`,
      [couponCode]
    );
    return res.rows[0] || null;
  }
}

module.exports = new MembershipsRepository();
