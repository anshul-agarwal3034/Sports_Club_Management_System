const express = require('express');
const membershipsController = require('./memberships.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');

const router = express.Router();

// Public Plans List & Referral Validation
router.get('/plans/:clubId', (req, res, next) => membershipsController.getClubPlans(req, res, next));
router.post('/referral/validate', (req, res, next) => membershipsController.validateReferral(req, res, next));

// Authenticated Membership Operations
router.post('/buy', authenticate, (req, res, next) => membershipsController.buyMembership(req, res, next));
router.get('/my', authenticate, (req, res, next) => membershipsController.getMyMembership(req, res, next));

module.exports = router;
