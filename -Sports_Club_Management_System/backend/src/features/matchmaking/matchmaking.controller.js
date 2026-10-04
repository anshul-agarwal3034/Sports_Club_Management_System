const matchmakingService = require('./matchmaking.service');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class MatchmakingController {
  async createLobby(req, res, next) {
    try {
      const result = await matchmakingService.createLobby(req.user, req.body);
      return sendSuccess(res, result, result.message, 201);
    } catch (err) {
      next(err);
    }
  }

  async findLobbies(req, res, next) {
    try {
      const lobbies = await matchmakingService.findLobbies(req.query);
      return sendSuccess(res, lobbies, 'Match lobbies retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async getLobbyDetails(req, res, next) {
    try {
      const { id } = req.params;
      const details = await matchmakingService.getLobbyDetails(id);
      return sendSuccess(res, details, 'Lobby details retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async requestToJoin(req, res, next) {
    try {
      const { id } = req.params;
      const result = await matchmakingService.requestToJoin(req.user, id);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async approveParticipant(req, res, next) {
    try {
      const { id, userId } = req.params;
      const result = await matchmakingService.reviewParticipant(req.user, id, userId, 'APPROVE');
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async rejectParticipant(req, res, next) {
    try {
      const { id, userId } = req.params;
      const result = await matchmakingService.reviewParticipant(req.user, id, userId, 'REJECT');
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async payShare(req, res, next) {
    try {
      const { id } = req.params;
      const result = await matchmakingService.payParticipantShare(req.user, id, req.body);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async withdraw(req, res, next) {
    try {
      const { id } = req.params;
      const result = await matchmakingService.withdrawParticipant(req.user, id);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async cancelLobby(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await matchmakingService.cancelLobby(req.user, id, reason);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async updateSelfRating(req, res, next) {
    try {
      const { sportType, selfRating } = req.body;
      if (!sportType || !selfRating) {
        return sendError(res, 'sportType and selfRating are required.', 400);
      }
      const rating = await matchmakingService.updateSelfRating(req.user.id, sportType, parseFloat(selfRating));
      return sendSuccess(res, rating, 'Self-assessed rating updated', 200);
    } catch (err) {
      next(err);
    }
  }

  async recordNoShow(req, res, next) {
    try {
      const { id, userId } = req.params;
      const result = await matchmakingService.recordNoShow(req.user, id, userId);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MatchmakingController();
