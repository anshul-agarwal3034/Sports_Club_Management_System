const notificationsRepository = require('./notifications.repository');

class NotificationsService {
  /**
   * Safe notification dispatcher - guaranteed to never throw or break caller transactions
   */
  async dispatchSafe({ userId, clubId, type, title, message, payload = {}, channel = 'IN_APP' }) {
    try {
      // 1. Check user preferences
      const prefs = await notificationsRepository.getPreferences(userId);
      if (type === 'FLASH_SALE' && !prefs.opt_in_flash_deals) {
        return null;
      }
      if (type.startsWith('MATCH_') && !prefs.opt_in_match_alerts) {
        return null;
      }
      if (type.startsWith('WAITLIST_') && !prefs.opt_in_waitlist_alerts) {
        return null;
      }

      // 2. Persist in-app notification
      const record = await notificationsRepository.createNotification(
        userId,
        clubId,
        type,
        title,
        message,
        payload,
        channel
      );

      // 3. Adapter boundary for external channels (SMS / Push)
      // Note: External SMS/Push gateways are not configured in this local environment;
      // In-app notifications are authoritative and delivered immediately.
      return record;
    } catch (err) {
      console.warn(`[NotificationsService] Notification delivery skipped non-fatally: ${err.message}`);
      return null;
    }
  }

  async getUserNotifications(userId) {
    return notificationsRepository.findUserNotifications(userId);
  }

  async markAsRead(notificationId, userId) {
    return notificationsRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId) {
    return notificationsRepository.markAllAsRead(userId);
  }

  async getPreferences(userId) {
    return notificationsRepository.getPreferences(userId);
  }

  async updatePreferences(userId, updateData) {
    return notificationsRepository.updatePreferences(userId, updateData);
  }
}

module.exports = new NotificationsService();
