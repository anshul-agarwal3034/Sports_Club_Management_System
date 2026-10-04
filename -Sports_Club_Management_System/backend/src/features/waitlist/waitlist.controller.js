const waitlistService = require('./waitlist.service');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class WaitlistController {
  async joinWaitlist(req, res, next) {
    try {
      const { clubId, courtId, startTime, endTime } = req.body;
      if (!clubId || !courtId || !startTime || !endTime) {
        return sendError(res, 'clubId, courtId, startTime, and endTime are required.', 400);
      }
      const result = await waitlistService.joinWaitlist(req.user, { clubId, courtId, startTime, endTime });
      return sendSuccess(res, result, result.message, 201);
    } catch (err) {
      next(err);
    }
  }

  async leaveWaitlist(req, res, next) {
    try {
      const { id } = req.params;
      const result = await waitlistService.leaveWaitlist(req.user, id);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async acceptOffer(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentMode = 'UPI' } = req.body;
      const result = await waitlistService.acceptOffer(req.user, id, paymentMode);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async declineOffer(req, res, next) {
    try {
      const { id } = req.params;
      const result = await waitlistService.declineOffer(req.user, id);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async getMyWaitlist(req, res, next) {
    try {
      const result = await waitlistService.getUserWaitlist(req.user.id);
      return sendSuccess(res, result, 'Fetched waitlist entries', 200);
    } catch (err) {
      next(err);
    }
  }

  async triggerExpirySweep(req, res, next) {
    try {
      const result = await waitlistService.processExpiredOffers();
      return sendSuccess(res, result, 'Expiry sweep completed', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WaitlistController();
