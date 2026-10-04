const express = require('express');
const router = express.Router();
const waitlistController = require('./waitlist.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');

router.use(authenticate);

// Customer waitlist actions
router.post('/join', waitlistController.joinWaitlist);
router.get('/my', waitlistController.getMyWaitlist);
router.post('/:id/leave', waitlistController.leaveWaitlist);
router.post('/:id/accept', waitlistController.acceptOffer);
router.post('/:id/decline', waitlistController.declineOffer);

// Worker / manual sweep trigger
router.post('/sweep-expired', waitlistController.triggerExpirySweep);

module.exports = router;
