const express = require('express');
const pricingController = require('./pricing.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');
const { enforceClubIsolation } = require('../../shared/middlewares/clubIsolation.middleware');

const router = express.Router();

// Calculate Price Breakdown (Public / Auth)
router.get('/calculate', (req, res, next) => pricingController.calculatePrice(req, res, next));

// Owner / Admin Endpoint: Update Dynamic Pricing Settings
router.put(
  '/rules/:clubId',
  authenticate,
  requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']),
  enforceClubIsolation,
  (req, res, next) => pricingController.updatePricingRules(req, res, next)
);

module.exports = router;
