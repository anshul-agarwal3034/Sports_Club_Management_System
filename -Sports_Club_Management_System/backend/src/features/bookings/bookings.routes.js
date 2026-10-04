const express = require('express');
const bookingsController = require('./bookings.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');
const { enforceClubIsolation } = require('../../shared/middlewares/clubIsolation.middleware');

const router = express.Router();

// Search Court Availability Grid (Public or Authenticated)
router.get('/availability', (req, res, next) => bookingsController.searchAvailability(req, res, next));

// Authenticated Booking Operations
router.post('/', authenticate, (req, res, next) => bookingsController.createBooking(req, res, next));
router.get('/my', authenticate, (req, res, next) => bookingsController.getMyBookings(req, res, next));

// Staff & Owner Club Booking Management (RBAC & Club Isolation)
router.get(
  '/club/:clubId',
  authenticate,
  requireRoles(['STAFF', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  enforceClubIsolation,
  (req, res, next) => bookingsController.getClubBookings(req, res, next)
);

// Cancel Booking & Update Status
router.post('/:id/cancel', authenticate, (req, res, next) => bookingsController.cancelBooking(req, res, next));
router.patch('/:id/status', authenticate, (req, res, next) => bookingsController.updateStatus(req, res, next));

module.exports = router;
