const express = require('express');
const router = express.Router();
const flashDealsController = require('./flashDeals.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');

// Public deal discovery (allows guest exploration or authenticated pricing)
router.get('/available', (req, res, next) => {
  // Optional auth
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}, flashDealsController.getAvailableDeals);

// Authenticated booking & config
router.post('/book', authenticate, flashDealsController.bookDeal);
router.get('/config/:clubId', authenticate, flashDealsController.getClubConfigs);
router.post('/config/:clubId', authenticate, flashDealsController.configureDeals);

module.exports = router;
