const membershipsService = require('./memberships.service');
const { BuyPlanSchema, ValidateReferralSchema, validate } = require('./memberships.validator');
const { sendSuccess } = require('../../shared/utils/response');

class MembershipsController {
  /**
   * GET /api/v1/memberships/plans/:clubId
   * Get all plans for a club
   */
  async getClubPlans(req, res, next) {
    try {
      const clubId = req.params.clubId;
      const plans = await membershipsService.getClubPlans(clubId);
      return sendSuccess(res, plans, 'Membership plans retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/memberships/buy
   * Purchase / Renew Membership Plan
   */
  async buyMembership(req, res, next) {
    try {
      const validatedData = validate(BuyPlanSchema, req.body);
      const result = await membershipsService.buyMembership(req.user, validatedData);
      return sendSuccess(res, result, result.message, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/memberships/my
   * Get Current Authenticated User's Active Membership & Digital QR Card
   */
  async getMyMembership(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await membershipsService.getUserMembership(userId);
      return sendSuccess(res, result, 'User membership status retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/memberships/referral/validate
   * Validate Referral Coupon Code
   */
  async validateReferral(req, res, next) {
    try {
      const validatedData = validate(ValidateReferralSchema, req.body);
      const result = await membershipsService.validateReferral(validatedData.referralCode);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MembershipsController();
