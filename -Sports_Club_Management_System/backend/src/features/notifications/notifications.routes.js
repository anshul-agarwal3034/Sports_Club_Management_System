const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');

router.use(authenticate);

router.get('/my', notificationsController.getMyNotifications);
router.patch('/:id/read', notificationsController.markAsRead);
router.post('/read-all', notificationsController.markAllAsRead);
router.get('/preferences', notificationsController.getPreferences);
router.put('/preferences', notificationsController.updatePreferences);

module.exports = router;
