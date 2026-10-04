const express = require('express');
const router = express.Router();
const peakRecommendationsController = require('./peakRecommendations.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');

router.use(authenticate);
router.use(requireRoles(['PLATFORM_ADMIN', 'CLUB_OWNER']));

router.get('/:clubId/recommendations', peakRecommendationsController.getRecommendations);
router.get('/:clubId/pending', peakRecommendationsController.getPending);
router.post('/action/:id', peakRecommendationsController.actionRecommendation);
router.post('/:clubId/autopilot', peakRecommendationsController.configureAutopilot);

module.exports = router;
