const notificationsService = require('./notifications.service');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class NotificationsController {
  async getMyNotifications(req, res, next) {
    try {
      const records = await notificationsService.getUserNotifications(req.user.id);
      return sendSuccess(res, records, 'User notifications retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const record = await notificationsService.markAsRead(id, req.user.id);
      return sendSuccess(res, record, 'Notification marked as read', 200);
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationsService.markAllAsRead(req.user.id);
      return sendSuccess(res, { success: true }, 'All notifications marked as read', 200);
    } catch (err) {
      next(err);
    }
  }

  async getPreferences(req, res, next) {
    try {
      const prefs = await notificationsService.getPreferences(req.user.id);
      return sendSuccess(res, prefs, 'Notification preferences retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const prefs = await notificationsService.updatePreferences(req.user.id, req.body);
      return sendSuccess(res, prefs, 'Notification preferences updated', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationsController();
