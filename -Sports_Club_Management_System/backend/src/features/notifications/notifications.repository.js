const { query } = require('../../shared/database/db');

class NotificationsRepository {
  async createNotification(userId, clubId, type, title, message, payload = {}, channel = 'IN_APP') {
    const res = await query(
      `INSERT INTO notifications (
        user_id, club_id, type, title, message, payload, channel, delivery_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DELIVERED')
      RETURNING *`,
      [userId, clubId, type, title, message, JSON.stringify(payload), channel]
    );
    return res.rows[0];
  }

  async findUserNotifications(userId) {
    const res = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    return res.rows;
  }

  async markAsRead(notificationId, userId) {
    const res = await query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return res.rows[0];
  }

  async markAllAsRead(userId) {
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [userId]
    );
    return { success: true };
  }

  async getPreferences(userId) {
    const res = await query(
      `SELECT * FROM user_notification_preferences WHERE user_id = $1`,
      [userId]
    );
    if (res.rows.length === 0) {
      // Create defaults
      const ins = await query(
        `INSERT INTO user_notification_preferences (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return ins.rows[0];
    }
    return res.rows[0];
  }

  async updatePreferences(userId, updateData) {
    const { optInFlashDeals, optInMatchAlerts, optInWaitlistAlerts, preferredSports, preferredCity, lastKnownLat, lastKnownLng } = updateData;
    const res = await query(
      `INSERT INTO user_notification_preferences (
        user_id, opt_in_flash_deals, opt_in_match_alerts, opt_in_waitlist_alerts, preferred_sports, preferred_city, last_known_lat, last_known_lng, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        opt_in_flash_deals = COALESCE(EXCLUDED.opt_in_flash_deals, user_notification_preferences.opt_in_flash_deals),
        opt_in_match_alerts = COALESCE(EXCLUDED.opt_in_match_alerts, user_notification_preferences.opt_in_match_alerts),
        opt_in_waitlist_alerts = COALESCE(EXCLUDED.opt_in_waitlist_alerts, user_notification_preferences.opt_in_waitlist_alerts),
        preferred_sports = COALESCE(EXCLUDED.preferred_sports, user_notification_preferences.preferred_sports),
        preferred_city = COALESCE(EXCLUDED.preferred_city, user_notification_preferences.preferred_city),
        last_known_lat = COALESCE(EXCLUDED.last_known_lat, user_notification_preferences.last_known_lat),
        last_known_lng = COALESCE(EXCLUDED.last_known_lng, user_notification_preferences.last_known_lng),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [userId, optInFlashDeals, optInMatchAlerts, optInWaitlistAlerts, preferredSports, preferredCity, lastKnownLat, lastKnownLng]
    );
    return res.rows[0];
  }
}

module.exports = new NotificationsRepository();
