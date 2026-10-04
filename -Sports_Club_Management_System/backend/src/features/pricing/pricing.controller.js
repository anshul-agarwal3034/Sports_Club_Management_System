const pricingService = require('./pricing.service');
const { CalculatePriceSchema, UpdatePricingRulesSchema, validate } = require('./pricing.validator');
const { sendSuccess } = require('../../shared/utils/response');

class PricingController {
  /**
   * GET /api/v1/pricing/calculate
   * Calculate Real-Time Price Breakdown
   */
  async calculatePrice(req, res, next) {
    try {
      const validatedData = validate(CalculatePriceSchema, {
        courtId: req.query.courtId,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        userId: req.query.userId,
      });

      const result = await pricingService.calculatePriceBreakdown(validatedData, req.user);
      return sendSuccess(res, result, 'Price breakdown calculated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/pricing/rules/:clubId
   * Update Dynamic Pricing Rules for a Club (Owner / Admin)
   */
  async updatePricingRules(req, res, next) {
    try {
      const clubId = req.params.clubId;
      const validatedData = validate(UpdatePricingRulesSchema, req.body);
      const result = await pricingService.updatePricingRules(clubId, validatedData);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PricingController();
