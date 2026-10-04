const express = require('express');
const canteenController = require('./canteen.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');

const router = express.Router();

// Order creation (Public / Authenticated POS or Mobile App)
router.post(
  '/orders',
  (req, res, next) => canteenController.createOrder(req, res, next)
);

// KDS Kitchen Queue Display
router.get(
  '/orders/kds',
  authenticate,
  requireRoles(['STAFF', 'KITCHEN_MANAGER', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => canteenController.getActiveKitchenQueue(req, res, next)
);

router.get(
  '/orders/kds/:clubId',
  authenticate,
  requireRoles(['STAFF', 'KITCHEN_MANAGER', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => canteenController.getActiveKitchenQueue(req, res, next)
);

// Club Orders List
router.get(
  '/orders/club/:clubId',
  authenticate,
  requireRoles(['STAFF', 'KITCHEN_MANAGER', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => canteenController.getClubOrders(req, res, next)
);

// Status update (NEW -> PREPARING -> READY -> SERVED / CANCELLED)
router.patch(
  '/orders/:id/status',
  authenticate,
  requireRoles(['STAFF', 'KITCHEN_MANAGER', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => canteenController.updateOrderStatus(req, res, next)
);

module.exports = router;
