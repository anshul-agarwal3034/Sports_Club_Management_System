const flashDealsService = require('./flashDeals.service');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class FlashDealsController {
  async getAvailableDeals(req, res, next) {
    try {
      const clubId = req.query.clubId || null;
      const deals = await flashDealsService.getAvailableFlashDeals(req.user || null, clubId);
      return sendSuccess(res, deals, 'Available flash deals retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async configureDeals(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.club_id;
      if (!clubId) {
        return sendError(res, 'clubId is required.', 400);
      }
      const config = await flashDealsService.configureDeals(req.user, clubId, req.body);
      return sendSuccess(res, config, 'Flash deal configuration saved', 200);
    } catch (err) {
      next(err);
    }
  }

  async getClubConfigs(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.club_id;
      const configs = await flashDealsService.getClubConfigs(clubId);
      return sendSuccess(res, configs, 'Flash deal configurations retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async bookDeal(req, res, next) {
    try {
      const result = await flashDealsService.bookFlashDeal(req.user, req.body);
      return sendSuccess(res, result, 'Flash deal booking confirmed!', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FlashDealsController();
