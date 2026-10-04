const peakRecommendationsService = require('./peakRecommendations.service');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class PeakRecommendationsController {
  async getRecommendations(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.club_id;
      const { sportType = 'Padel', days = 30 } = req.query;
      const result = await peakRecommendationsService.generateRecommendations(
        clubId,
        sportType,
        parseInt(days, 10)
      );
      return sendSuccess(res, result, 'Historical peak recommendations calculated', 200);
    } catch (err) {
      next(err);
    }
  }

  async actionRecommendation(req, res, next) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
        return sendError(res, "action must be either 'APPROVE' or 'REJECT'.", 400);
      }
      const result = await peakRecommendationsService.actionRecommendation(req.user, id, action, notes);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async configureAutopilot(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.club_id;
      const { sportType, isEnabled, maxDelta } = req.body;
      if (!sportType) {
        return sendError(res, 'sportType is required.', 400);
      }
      const result = await peakRecommendationsService.configureAutopilot(
        req.user,
        clubId,
        sportType,
        isEnabled,
        maxDelta
      );
      return sendSuccess(res, result, 'Autopilot configuration updated', 200);
    } catch (err) {
      next(err);
    }
  }

  async getPending(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.club_id;
      const list = await peakRecommendationsService.getClubRecommendations(clubId, req.query.status || 'PENDING');
      return sendSuccess(res, list, 'Club recommendations retrieved', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PeakRecommendationsController();
