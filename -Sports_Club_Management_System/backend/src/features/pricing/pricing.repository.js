const { query } = require('../../shared/database/db');

class PricingRepository {
  /**
   * Invoke SQL function: calculate_booking_price
   */
  async calculatePrice(courtId, userId, startTime, endTime) {
    const res = await query(
      `SELECT calculate_booking_price($1, $2, $3, $4) as price`,
      [courtId, userId || null, startTime, endTime]
    );
    return parseFloat(res.rows[0].price);
  }

  /**
   * Get dynamic pricing rules for a club and sport type
   */
  async findRulesByClubAndSport(clubId, sportType) {
    const res = await query(
      `SELECT id, club_id, sport_type, is_enabled, strategy, peak_start_hour, peak_end_hour,
              peak_multiplier, price_floor, price_ceiling, last_minute_discount_pct
       FROM dynamic_pricing_rules
       WHERE club_id = $1 AND LOWER(sport_type) = LOWER($2)`,
      [clubId, sportType]
    );
    return res.rows[0] || null;
  }

  /**
   * Upsert Dynamic Pricing Rules for a Club
   */
  async upsertRules(clubId, rulesData) {
    const {
      sportType,
      isEnabled = true,
      strategy = 'BALANCED',
      peakStartHour = 18,
      peakEndHour = 22,
      peakMultiplier = 1.25,
      priceFloor,
      priceCeiling,
      lastMinuteDiscountPct = 15,
    } = rulesData;

    const res = await query(
      `INSERT INTO dynamic_pricing_rules (
        club_id, sport_type, is_enabled, strategy, peak_start_hour, peak_end_hour, 
        peak_multiplier, price_floor, price_ceiling, last_minute_discount_pct
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (club_id, sport_type) DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        strategy = EXCLUDED.strategy,
        peak_start_hour = EXCLUDED.peak_start_hour,
        peak_end_hour = EXCLUDED.peak_end_hour,
        peak_multiplier = EXCLUDED.peak_multiplier,
        price_floor = EXCLUDED.price_floor,
        price_ceiling = EXCLUDED.price_ceiling,
        last_minute_discount_pct = EXCLUDED.last_minute_discount_pct
       RETURNING *`,
      [
        clubId,
        sportType,
        isEnabled,
        strategy,
        peakStartHour,
        peakEndHour,
        peakMultiplier,
        priceFloor,
        priceCeiling,
        lastMinuteDiscountPct,
      ]
    );
    return res.rows[0];
  }
}

module.exports = new PricingRepository();
