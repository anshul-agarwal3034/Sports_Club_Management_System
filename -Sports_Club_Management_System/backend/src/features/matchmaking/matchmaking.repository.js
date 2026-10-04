const { query, pool } = require('../../shared/database/db');

class MatchmakingRepository {
  async createLobby(lobbyData, client = null) {
    const db = client || pool;
    const {
      clubId,
      courtId,
      bookingId,
      hostUserId,
      sportType,
      gameType,
      matchStartTime,
      matchEndTime,
      minSkillLevel,
      maxSkillLevel,
      totalCapacity,
      paymentModel,
      courtTotalPrice,
      costPerPlayer,
      status,
    } = lobbyData;

    const res = await db.query(
      `INSERT INTO match_lobbies (
        club_id, court_id, booking_id, host_user_id, sport_type, game_type,
        match_start_time, match_end_time, min_skill_level, max_skill_level,
        total_capacity, payment_model, court_total_price, cost_per_player, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        clubId,
        courtId,
        bookingId,
        hostUserId,
        sportType,
        gameType,
        matchStartTime,
        matchEndTime,
        minSkillLevel,
        maxSkillLevel,
        totalCapacity,
        paymentModel,
        courtTotalPrice,
        costPerPlayer,
        status,
      ]
    );
    return res.rows[0];
  }

  async findLobbyById(id, forUpdate = false, client = null) {
    const db = client || pool;
    let sql = `
      SELECT l.*, c.name as court_name, cl.name as club_name, cl.city,
             u.full_name as host_name, u.email as host_email
      FROM match_lobbies l
      LEFT JOIN courts c ON l.court_id = c.id
      JOIN clubs cl ON l.club_id = cl.id
      JOIN users u ON l.host_user_id = u.id
      WHERE l.id = $1
    `;
    if (forUpdate) {
      sql += ` FOR UPDATE OF l`;
    }
    const res = await db.query(sql, [id]);
    return res.rows[0] || null;
  }

  async findOpenLobbies(filters = {}) {
    const { clubId, sportType, gameType, minSkill, maxSkill } = filters;
    let sql = `
      SELECT l.*, c.name as court_name, cl.name as club_name, cl.city,
             u.full_name as host_name,
             (
               SELECT COUNT(*) 
               FROM match_participants p 
               WHERE p.match_id = l.id AND p.approval_status = 'APPROVED'
             ) as approved_player_count
      FROM match_lobbies l
      LEFT JOIN courts c ON l.court_id = c.id
      JOIN clubs cl ON l.club_id = cl.id
      JOIN users u ON l.host_user_id = u.id
      WHERE l.status IN ('OPEN', 'DRAFT')
        AND l.match_start_time > CURRENT_TIMESTAMP
    `;
    const params = [];

    if (clubId) {
      params.push(clubId);
      sql += ` AND l.club_id = $${params.length}`;
    }
    if (sportType) {
      params.push(sportType);
      sql += ` AND LOWER(l.sport_type) = LOWER($${params.length})`;
    }
    if (gameType) {
      params.push(gameType);
      sql += ` AND l.game_type = $${params.length}`;
    }
    if (minSkill) {
      params.push(minSkill);
      sql += ` AND l.max_skill_level >= $${params.length}`;
    }
    if (maxSkill) {
      params.push(maxSkill);
      sql += ` AND l.min_skill_level <= $${params.length}`;
    }

    sql += ` ORDER BY l.match_start_time ASC LIMIT 50`;

    const res = await query(sql, params);
    return res.rows;
  }

  async addParticipant(participantData, client = null) {
    const db = client || pool;
    const { matchId, userId, isHost, approvalStatus, paymentStatus, shareAmount } = participantData;
    const res = await db.query(
      `INSERT INTO match_participants (
        match_id, user_id, is_host, approval_status, payment_status, share_amount
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [matchId, userId, isHost, approvalStatus, paymentStatus, shareAmount]
    );
    return res.rows[0];
  }

  async getParticipants(matchId, client = null) {
    const db = client || pool;
    const res = await db.query(
      `SELECT p.*, u.full_name, u.email,
              COALESCE(r.self_rating, 2.5) as self_rating,
              r.verified_rating,
              r.is_verified,
              COALESCE(r.matches_played, 0) as matches_played,
              COALESCE(r.matches_completed, 0) as matches_completed,
              COALESCE(r.no_shows, 0) as no_shows
       FROM match_participants p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN match_lobbies l ON p.match_id = l.id
       LEFT JOIN user_sport_ratings r ON p.user_id = r.user_id AND LOWER(r.sport_type) = LOWER(l.sport_type)
       WHERE p.match_id = $1
       ORDER BY p.is_host DESC, p.joined_at ASC`,
      [matchId]
    );
    return res.rows;
  }

  async findParticipant(matchId, userId, forUpdate = false, client = null) {
    const db = client || pool;
    let sql = `SELECT * FROM match_participants WHERE match_id = $1 AND user_id = $2`;
    if (forUpdate) {
      sql += ` FOR UPDATE`;
    }
    const res = await db.query(sql, [matchId, userId]);
    return res.rows[0] || null;
  }

  async countApprovedParticipants(matchId, client = null) {
    const db = client || pool;
    const res = await db.query(
      `SELECT COUNT(*) FROM match_participants WHERE match_id = $1 AND approval_status = 'APPROVED'`,
      [matchId]
    );
    return parseInt(res.rows[0].count, 10);
  }

  async updateParticipantStatus(matchId, userId, approvalStatus, paymentStatus = null, client = null) {
    const db = client || pool;
    let sql = `
      UPDATE match_participants 
      SET approval_status = $1::varchar,
          approved_at = CASE WHEN $1::varchar = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE approved_at END
    `;
    const params = [approvalStatus, matchId, userId];

    if (paymentStatus) {
      sql += `, payment_status = $4`;
      params.push(paymentStatus);
    }

    sql += ` WHERE match_id = $2 AND user_id = $3 RETURNING *`;
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  async updateLobbyStatus(matchId, status, client = null) {
    const db = client || pool;
    const res = await db.query(
      `UPDATE match_lobbies SET status = $1 WHERE id = $2 RETURNING *`,
      [status, matchId]
    );
    return res.rows[0];
  }

  async recordPayment(paymentData, client = null) {
    const db = client || pool;
    const { matchId, participantId, userId, amount, paymentMode, paymentStatus, reference, refundReason } = paymentData;
    const res = await db.query(
      `INSERT INTO match_payments (
        match_id, participant_id, user_id, amount, payment_mode, payment_status, transaction_reference, refund_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [matchId, participantId, userId, amount, paymentMode, paymentStatus, reference, refundReason]
    );
    return res.rows[0];
  }

  async getPlayerRating(userId, sportType) {
    const res = await query(
      `SELECT * FROM user_sport_ratings WHERE user_id = $1 AND LOWER(sport_type) = LOWER($2)`,
      [userId, sportType]
    );
    return res.rows[0] || null;
  }

  async upsertPlayerRating(userId, sportType, selfRating) {
    const res = await query(
      `INSERT INTO user_sport_ratings (user_id, sport_type, self_rating, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, sport_type) DO UPDATE SET
         self_rating = EXCLUDED.self_rating,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, sportType, selfRating]
    );
    return res.rows[0];
  }

  async incrementNoShow(userId, sportType) {
    await query(
      `UPDATE user_sport_ratings 
       SET no_shows = no_shows + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND LOWER(sport_type) = LOWER($2)`,
      [userId, sportType]
    );
  }
}

module.exports = new MatchmakingRepository();
