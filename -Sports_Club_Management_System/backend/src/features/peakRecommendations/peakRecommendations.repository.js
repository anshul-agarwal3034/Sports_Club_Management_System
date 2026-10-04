const { query, pool } = require('../../shared/database/db');

class PeakRecommendationsRepository {
  /**
   * Aggregate historical occupancy by club, sport, weekday, and hour bucket
   */
  async calculateHistoricalOccupancy(clubId, sportType, days = 30) {
    const res = await query(
      `WITH slots_analysis AS (
        SELECT 
          EXTRACT(DOW FROM lower(b.booking_time_range))::INT as weekday,
          EXTRACT(HOUR FROM lower(b.booking_time_range))::INT as hour_bucket,
          COUNT(b.id) as bookings_count,
          SUM(EXTRACT(EPOCH FROM (upper(b.booking_time_range) - lower(b.booking_time_range))) / 60.0) as booked_minutes
        FROM bookings b
        JOIN courts c ON b.court_id = c.id
        WHERE b.club_id = $1
          AND ($2::text IS NULL OR LOWER(c.sport_type) = LOWER($2))
          AND b.status = 'CONFIRMED'
          AND lower(b.booking_time_range) >= (CURRENT_TIMESTAMP - ($3 || ' days')::INTERVAL)
          AND lower(b.booking_time_range) <= CURRENT_TIMESTAMP
        GROUP BY 1, 2
      ),
      court_capacity AS (
        SELECT 
          COUNT(id) as total_courts
        FROM courts
        WHERE club_id = $1
          AND ($2::text IS NULL OR LOWER(sport_type) = LOWER($2))
      )
      SELECT 
        s.weekday,
        s.hour_bucket,
        s.bookings_count,
        s.booked_minutes,
        c.total_courts,
        -- Total available minutes across the observation period for this (weekday, hour)
        -- In 30 days, each weekday occurs ~4.28 times
        ROUND(($3::numeric / 7.0) * c.total_courts * 60.0, 2) as available_minutes,
        ROUND(
          LEAST(100.0, (s.booked_minutes / NULLIF(($3::numeric / 7.0) * c.total_courts * 60.0, 0)) * 100.0),
          2
        ) as occupancy_pct
      FROM slots_analysis s
      CROSS JOIN court_capacity c
      WHERE c.total_courts > 0
      ORDER BY s.weekday ASC, s.hour_bucket ASC`,
      [clubId, sportType || null, days]
    );
    return res.rows;
  }

  async getCurrentPricingRule(clubId, sportType) {
    const res = await query(
      `SELECT * FROM dynamic_pricing_rules 
       WHERE club_id = $1 AND LOWER(sport_type) = LOWER($2)
       LIMIT 1`,
      [clubId, sportType]
    );
    return res.rows[0] || null;
  }

  async saveRecommendation(recData, client = null) {
    const db = client || pool;
    const {
      clubId,
      sportType,
      weekday,
      hourBucket,
      observationPeriodDays,
      sampleSlotsCount,
      occupancyPct,
      occupancyBand,
      currentMultiplier,
      proposedMultiplier,
      status,
      decisionNotes,
    } = recData;

    const res = await db.query(
      `INSERT INTO pricing_recommendations (
        club_id, sport_type, weekday, hour_bucket, observation_period_days, sample_slots_count,
        occupancy_pct, occupancy_band, current_multiplier, proposed_multiplier, status, decision_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        clubId,
        sportType,
        weekday,
        hourBucket,
        observationPeriodDays,
        sampleSlotsCount,
        occupancyPct,
        occupancyBand,
        currentMultiplier,
        proposedMultiplier,
        status || 'PENDING',
        decisionNotes || null,
      ]
    );
    return res.rows[0];
  }

  async getRecommendationsForClub(clubId, status = 'PENDING') {
    const res = await query(
      `SELECT * FROM pricing_recommendations
       WHERE club_id = $1 AND ($2::text IS NULL OR status = $2)
       ORDER BY created_at DESC LIMIT 50`,
      [clubId, status]
    );
    return res.rows;
  }

  async findRecommendationById(id) {
    const res = await query(`SELECT * FROM pricing_recommendations WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async updateRecommendationStatus(id, status, decisionBy, notes = null, client = null) {
    const db = client || pool;
    const res = await db.query(
      `UPDATE pricing_recommendations
       SET status = $1, decision_by = $2, decision_notes = COALESCE($3, decision_notes), actioned_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, decisionBy, notes, id]
    );
    return res.rows[0];
  }

  async updateDynamicPricingPeakHours(clubId, sportType, peakStart, peakEnd, multiplier, client = null) {
    const db = client || pool;
    const res = await db.query(
      `UPDATE dynamic_pricing_rules
       SET peak_start_hour = $1,
           peak_end_hour = $2,
           peak_multiplier = $3
       WHERE club_id = $4 AND LOWER(sport_type) = LOWER($5)
       RETURNING *`,
      [peakStart, peakEnd, multiplier, clubId, sportType]
    );
    return res.rows[0];
  }

  async updateAutopilotSettings(clubId, sportType, isAutopilotEnabled, maxDelta) {
    const res = await query(
      `UPDATE dynamic_pricing_rules
       SET is_autopilot_enabled = $1,
           max_auto_multiplier_delta = $2
       WHERE club_id = $3 AND LOWER(sport_type) = LOWER($4)
       RETURNING *`,
      [isAutopilotEnabled, maxDelta, clubId, sportType]
    );
    return res.rows[0];
  }
}

module.exports = new PeakRecommendationsRepository();
