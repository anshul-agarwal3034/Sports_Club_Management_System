const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');
const { enforceClubIsolation } = require('../../shared/middlewares/clubIsolation.middleware');

const router = express.Router();

// Public Auth Endpoints
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/qr-signup', (req, res, next) => authController.qrSignup(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// Authenticated Profile Endpoint
router.get('/me', authenticate, (req, res, next) => authController.getProfile(req, res, next));

// RBAC Protected Test Routes
router.get(
  '/admin-only',
  authenticate,
  requireRoles(['PLATFORM_ADMIN']),
  (req, res) => authController.verifyRole(req, res)
);

router.get(
  '/owner-only',
  authenticate,
  requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res) => authController.verifyRole(req, res)
);

router.get(
  '/staff-only',
  authenticate,
  requireRoles(['STAFF', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res) => authController.verifyRole(req, res)
);

module.exports = router;
