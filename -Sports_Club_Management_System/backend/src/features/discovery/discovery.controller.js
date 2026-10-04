const discoveryService = require('./discovery.service');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class DiscoveryController {
  async searchClubs(req, res, next) {
    try {
      const clubs = await discoveryService.searchClubs(req.query);
      return sendSuccess(res, clubs, 'Clubs retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getMyMemberships(req, res, next) {
    try {
      const memberships = await discoveryService.getUserClubMemberships(req.user.id);
      return sendSuccess(res, memberships, 'User club memberships retrieved', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DiscoveryController();
