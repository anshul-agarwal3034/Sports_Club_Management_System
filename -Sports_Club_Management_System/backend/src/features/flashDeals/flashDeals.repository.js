const { query } = require('../../shared/database/db');

class FlashDealsRepository {
  async getConfig(clubId, sportType) {
    const res = await query(
      `SELECT * FROM club_flash_deals_config 
       WHERE club_id = $1 AND LOWER(sport_type) = LOWER($2)
       LIMIT 1`,
      [clubId, sportType]
    );
    return res.rows[0] || null;
  }

  async getAllConfigsForClub(clubId) {
    const res = await query(
      `SELECT * FROM club_flash_deals_config WHERE club_id = $1`,
      [clubId]
    );
    return res.rows;
  }

  async upsertConfig(clubId, sportType, isEnabled, leadHoursThreshold, discountPct, priceFloor) {
    const res = await query(
      `INSERT INTO club_flash_deals_config (
        club_id, sport_type, is_enabled, lead_hours_threshold, discount_pct, price_floor, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (club_id, sport_type) DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        lead_hours_threshold = EXCLUDED.lead_hours_threshold,
        discount_pct = EXCLUDED.discount_pct,
        price_floor = EXCLUDED.price_floor,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [clubId, sportType, isEnabled, leadHoursThreshold, discountPct, priceFloor]
    );
    return res.rows[0];
  }

  async getUpcomingSlotsWithinHours(clubId, hours = 3) {
    const res = await query(
      `SELECT c.id as court_id, c.club_id, c.name as court_name, c.sport_type, c.base_price_per_hour,
              cl.name as club_name, cl.city
       FROM courts c
       JOIN clubs cl ON c.club_id = cl.id
       WHERE ($1::uuid IS NULL OR c.club_id = $1)
       ORDER BY c.name ASC`,
      [clubId]
    );
    return res.rows;
  }

  async hasActiveWaitlist(courtId, startTime, endTime) {
    const res = await query(
      `SELECT 1 FROM slot_waitlist
       WHERE court_id = $1
         AND desired_time_range && tstzrange($2::timestamptz, $3::timestamptz)
         AND status IN ('WAITING', 'OFFERED', 'PAYMENT_HOLD')
       LIMIT 1`,
      [courtId, startTime, endTime]
    );
    return res.rows.length > 0;
  }
}

module.exports = new FlashDealsRepository();
