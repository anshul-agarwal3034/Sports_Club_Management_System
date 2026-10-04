const pricingRepository = require('./pricing.repository');
const bookingsRepository = require('../bookings/bookings.repository');
const membershipsRepository = require('../memberships/memberships.repository');

class PricingService {
  /**
   * Calculate Detailed Real-Time Price Breakdown
   */
  async calculatePriceBreakdown(calcDto, currentUser = null) {
    const { courtId, startTime, endTime, userId } = calcDto;
    const targetUserId = userId || (currentUser ? currentUser.id : null);

    // 1. Get Court details
    const courtRes = await bookingsRepository.findBookingById(courtId); // or query court
    const basePrice = 800.00; // court base rate

    // 2. Check if target user has an active membership
    let activeMembership = null;
    if (targetUserId) {
      activeMembership = await membershipsRepository.findActiveUserMembership(targetUserId);
    }

    // 3. Call DB pricing engine function
    const calculatedPrice = await pricingRepository.calculatePrice(
      courtId,
      targetUserId,
      startTime,
      endTime
    );

    const start = new Date(startTime);
    const startHour = start.getUTCHours();
    const isPeakHour = startHour >= 18 && startHour < 22;

    if (activeMembership) {
      // Member path -> Surge Protected
      return {
        basePrice,
        finalPrice: calculatedPrice,
        isMember: true,
        memberTier: activeMembership.tier,
        discountAppliedPct: parseFloat(activeMembership.court_discount_pct),
        discountAmount: basePrice - calculatedPrice,
        isPeakHour,
        surgeProtected: true,
        pricingExplanation: `${activeMembership.tier} member fixed discount of ${activeMembership.court_discount_pct}% applied to base price. Dynamic surge is blocked for members.`,
      };
    } else {
      // Non-Member path -> Dynamic Surge / Floor / Ceiling
      return {
        basePrice,
        finalPrice: calculatedPrice,
        isMember: false,
        memberTier: null,
        isPeakHour,
        surgeApplied: isPeakHour,
        surgeMultiplier: isPeakHour ? 1.25 : 1.0,
        nudgeMessage: isPeakHour
          ? 'Peak hour rates apply for non-members. Upgrade to Gold or Silver to lock 50% discount and bypass surge pricing!'
          : 'Standard non-member rate.',
        pricingExplanation: isPeakHour
          ? '1.25x Peak multiplier applied (18:00 to 22:00).'
          : 'Off-peak standard pricing.',
      };
    }
  }

  /**
   * Upsert Club Dynamic Pricing Rules (Owner / Admin)
   */
  async updatePricingRules(clubId, rulesDto) {
    const updated = await pricingRepository.upsertRules(clubId, rulesDto);
    return {
      rules: updated,
      message: `Dynamic pricing rules for '${rulesDto.sportType}' updated successfully.`,
    };
  }
}

module.exports = new PricingService();
