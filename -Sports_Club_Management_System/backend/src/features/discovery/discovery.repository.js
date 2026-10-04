const { query } = require('../../shared/database/db');

class DiscoveryRepository {
  /**
   * Search clubs with optional Haversine distance, city filter, sport type, and availability
   */
  async searchClubs(filters) {
    const { lat, lng, radiusKm, city, sportType, date } = filters;

    let sql = `
      SELECT c.id, c.name, c.address, c.city, c.is_verified, c.rating_badge,
             c.latitude, c.longitude, c.open_time, c.close_time,
             (
               SELECT COUNT(*) FROM courts ct 
               WHERE ct.club_id = c.id 
                 AND ($1::text IS NULL OR LOWER(ct.sport_type) = LOWER($1))
             ) as court_count,
             (
               SELECT MIN(ct.base_price_per_hour) FROM courts ct 
               WHERE ct.club_id = c.id
                 AND ($1::text IS NULL OR LOWER(ct.sport_type) = LOWER($1))
             ) as min_base_price
    `;
    const params = [sportType || null];

    // Geospatial distance calculation
    if (lat !== undefined && lng !== undefined) {
      params.push(lat, lng);
      sql += `, calculate_distance_km($2, $3, c.latitude, c.longitude) as distance_km `;
    } else {
      sql += `, NULL as distance_km `;
    }

    sql += `
      FROM clubs c
      WHERE c.is_verified = TRUE
    `;

    // City / Area text filter when location permission is absent
    if (city) {
      params.push(`%${city}%`);
      sql += ` AND (c.city ILIKE $${params.length} OR c.address ILIKE $${params.length})`;
    }

    // Radius filter (if lat, lng, radius specified)
    if (lat !== undefined && lng !== undefined && radiusKm) {
      params.push(radiusKm);
      sql += ` AND calculate_distance_km($2, $3, c.latitude, c.longitude) <= $${params.length}`;
    }

    // Must have at least 1 court matching sport (if filtered)
    if (sportType) {
      sql += ` AND EXISTS (SELECT 1 FROM courts ct WHERE ct.club_id = c.id AND LOWER(ct.sport_type) = LOWER($1))`;
    }

    // Ordering: nearest first if location provided, else by rating_badge and name
    if (lat !== undefined && lng !== undefined) {
      sql += ` ORDER BY distance_km ASC NULLS LAST, c.name ASC`;
    } else {
      sql += ` ORDER BY c.rating_badge DESC, c.name ASC`;
    }

    sql += ` LIMIT 50`;

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Get user memberships across all clubs
   */
  async getUserClubMemberships(userId) {
    const res = await query(
      `SELECT um.id, um.club_id, um.start_date, um.expiry_date, um.is_active,
              cl.name as club_name, cl.city as club_city, cl.rating_badge,
              mp.tier, mp.court_discount_pct, mp.rental_discount_pct, mp.shop_discount_pct, mp.food_discount_pct
       FROM user_memberships um
       JOIN clubs cl ON um.club_id = cl.id
       JOIN membership_plans mp ON um.plan_id = mp.id
       WHERE um.user_id = $1
       ORDER BY um.is_active DESC, um.expiry_date DESC`,
      [userId]
    );
    return res.rows;
  }
}

module.exports = new DiscoveryRepository();
