const membershipsRepository = require('./memberships.repository');

class MembershipsService {
  /**
   * Get all plans for a club
   */
  async getClubPlans(clubId) {
    return membershipsRepository.findPlansByClub(clubId);
  }

  /**
   * Purchase or Renew Membership Plan
   */
  async buyMembership(user, buyDto) {
    const { planId, paymentMode = 'UPI', referralCode } = buyDto;

    // 1. Check if plan exists
    const plan = await membershipsRepository.findPlanById(planId);
    if (!plan) {
      const err = new Error(`Membership plan with ID '${planId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Pay Later Eligibility Check (PAY_LATER is allowed ONLY for Gold tier members)
    if (paymentMode === 'PAY_LATER') {
      if (plan.tier !== 'GOLD') {
        const err = new Error(`Pay Later is a Gold-exclusive privilege. Upgrade to Gold to use Pay Later.`);
        err.statusCode = 403;
        throw err;
      }
    }

    // 3. Referral Coupon Check
    let validReferralCode = null;
    if (referralCode) {
      const referral = await membershipsRepository.findReferralByCode(referralCode);
      if (!referral) {
        const err = new Error(`Referral coupon code '${referralCode}' is invalid or expired.`);
        err.statusCode = 400;
        throw err;
      }
      validReferralCode = referralCode;
    }

    // 4. Invoke DB stored procedure (Adds 15 grace days, sets Gold credit limit ₹2000, updates role)
    const result = await membershipsRepository.purchaseMembership(
      user.id,
      planId,
      paymentMode,
      validReferralCode
    );

    return {
      membershipId: result.membership_id,
      tier: plan.tier,
      pricePaid: parseFloat(result.amount_paid),
      expiryDate: result.expiry_date,
      graceDaysAdded: 15,
      allowsPayLater: plan.allows_pay_later,
      creditLimit: plan.tier === 'GOLD' ? 2000.00 : 0.00,
      discounts: {
        courtDiscountPct: parseFloat(plan.court_discount_pct),
        rentalDiscountPct: parseFloat(plan.rental_discount_pct),
        shopDiscountPct: parseFloat(plan.shop_discount_pct),
        foodDiscountPct: parseFloat(plan.food_discount_pct),
      },
      message: result.status_msg || 'Membership successfully activated with 15 bonus grace days!',
    };
  }

  /**
   * Get Current Authenticated User's Membership & Digital QR Card Data
   */
  async getUserMembership(userId) {
    const membership = await membershipsRepository.findActiveUserMembership(userId);
    if (!membership) {
      return {
        hasActiveMembership: false,
        tier: null,
        message: 'No active membership plan found. Upgrade to Gold or Silver to unlock member discounts.',
      };
    }

    // Generate Digital QR Member Card payload
    const qrCardPayload = {
      cardId: membership.id,
      userId: membership.user_id,
      clubId: membership.club_id,
      clubName: membership.club_name,
      tier: membership.tier,
      expiryDate: membership.expiry_date,
    };

    return {
      hasActiveMembership: true,
      membershipId: membership.id,
      clubId: membership.club_id,
      clubName: membership.club_name,
      tier: membership.tier,
      startDate: membership.start_date,
      expiryDate: membership.expiry_date,
      graceDaysAdded: membership.grace_days_added,
      discounts: {
        courtDiscountPct: parseFloat(membership.court_discount_pct),
        rentalDiscountPct: parseFloat(membership.rental_discount_pct),
        shopDiscountPct: parseFloat(membership.shop_discount_pct),
      },
      perks: {
        allowsPayLater: membership.allows_pay_later,
        freeCoachingSessionsPerMonth: membership.free_coaching_sessions_per_month,
      },
      digitalQrCard: qrCardPayload,
    };
  }

  /**
   * Validate Referral Code
   */
  async validateReferral(couponCode) {
    const referral = await membershipsRepository.findReferralByCode(couponCode);
    if (!referral) {
      const err = new Error(`Referral coupon code '${couponCode}' is invalid.`);
      err.statusCode = 404;
      throw err;
    }

    return {
      isValid: true,
      couponCode: referral.coupon_code,
      friendDiscountPct: parseFloat(referral.friend_discount_pct),
      message: `Referral coupon valid! Gives ${referral.friend_discount_pct}% off your first membership.`,
    };
  }
}

module.exports = new MembershipsService();
