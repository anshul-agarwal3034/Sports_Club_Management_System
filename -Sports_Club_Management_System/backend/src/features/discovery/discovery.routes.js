const express = require('express');
const router = express.Router();
const discoveryController = require('./discovery.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');

// Public geo/city search
router.get('/search', discoveryController.searchClubs);

// Authenticated multi-club member relations
router.get('/my-memberships', authenticate, discoveryController.getMyMemberships);

module.exports = router;
