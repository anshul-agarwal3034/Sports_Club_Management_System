const express = require('express');
const router = express.Router();
const matchmakingController = require('./matchmaking.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');

// Public match discovery (guests can browse open lobbies)
router.get('/lobbies', matchmakingController.findLobbies);
router.get('/lobbies/:id', matchmakingController.getLobbyDetails);

// Authenticated interactions
router.use(authenticate);
router.post('/lobbies', matchmakingController.createLobby);
router.post('/lobbies/:id/join', matchmakingController.requestToJoin);
router.post('/lobbies/:id/participants/:userId/approve', matchmakingController.approveParticipant);
router.post('/lobbies/:id/participants/:userId/reject', matchmakingController.rejectParticipant);
router.post('/lobbies/:id/pay', matchmakingController.payShare);
router.post('/lobbies/:id/withdraw', matchmakingController.withdraw);
router.post('/lobbies/:id/cancel', matchmakingController.cancelLobby);
router.post('/lobbies/:id/participants/:userId/no-show', matchmakingController.recordNoShow);
router.post('/ratings', matchmakingController.updateSelfRating);

module.exports = router;
