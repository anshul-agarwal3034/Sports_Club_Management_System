const { pool } = require('../../shared/database/db');
const flashDealsRepository = require('./flashDeals.repository');
const waitlistRepository = require('../waitlist/waitlist.repository');
const notificationsService = require('../notifications/notifications.service');
const bookingsRepository = require('../bookings/bookings.repository');

class FlashDealsService {
  /**
   * Owner configures flash deals for a sport
   */
  async configureDeals(user, clubId, configDto) {
    if (user.role !== 'PLATFORM_ADMIN' && user.role !== 'CLUB_OWNER') {
      const err = new Error('Unauthorized: Only club owners and admins can configure flash deals.');
      err.statusCode = 403;
      throw err;
    }

    const { sportType, isEnabled = true, leadHoursThreshold = 3, discountPct = 20.0, priceFloor = 400.0 } = configDto;

    if (!sportType) {
      const err = new Error('sportType is required.');
      err.statusCode = 400;
      throw err;
    }

    if (discountPct < 0 || discountPct > 70) {
      const err = new Error('discountPct must be between 0% and 70%.');
      err.statusCode = 400;
      throw err;
    }

    return flashDealsRepository.upsertConfig(
      clubId,
      sportType,
      isEnabled,
      leadHoursThreshold,
      discountPct,
      priceFloor
    );
  }

  /**
   * Get all flash configurations for a club
   */
  async getClubConfigs(clubId) {
    return flashDealsRepository.getAllConfigsForClub(clubId);
  }

  /**
   * Find all active last-minute flash deals
   * Criteria:
   * 1. Slot starts within configured lead hours (default <= 3 hours from now)
   * 2. Slot is 100% available (no confirmed booking or active hold)
   * 3. No active waitlist (Waitlist has strict priority over public flash sale)
   * 4. Truthful quote calculation with no double-discounting
   */
  async getAvailableFlashDeals(user = null, clubId = null) {
    const courts = await flashDealsRepository.getUpcomingSlotsWithinHours(clubId);
    const deals = [];
    const now = new Date();

    for (const court of courts) {
      // 1. Fetch deal config for court's sport
      let config = await flashDealsRepository.getConfig(court.club_id, court.sport_type);
      if (!config || !config.is_enabled) {
        // Fallback default: enabled with 3 hours and 20% discount if club owner enabled dynamic pricing
        const dpRule = await pool.query(
          `SELECT is_enabled, price_floor, price_ceiling, last_minute_discount_pct 
           FROM dynamic_pricing_rules WHERE club_id = $1 AND LOWER(sport_type) = LOWER($2)`,
          [court.club_id, court.sport_type]
        );
        if (dpRule.rows.length > 0 && dpRule.rows[0].is_enabled) {
          config = {
            is_enabled: true,
            lead_hours_threshold: 3,
            discount_pct: parseFloat(dpRule.rows[0].last_minute_discount_pct || 20.0),
            price_floor: parseFloat(dpRule.rows[0].price_floor || 400.0),
          };
        } else {
          continue; // Flash deals not enabled for this sport
        }
      }

      const thresholdHours = config.lead_hours_threshold || 3;
      const windowEnd = new Date(now.getTime() + thresholdHours * 60 * 60 * 1000);

      // Check upcoming hourly slots between now and windowEnd
      const startSlotHour = now.getHours() + 1;
      const maxSlotHour = windowEnd.getHours() + (windowEnd.getDate() > now.getDate() ? 24 : 0);

      for (let h = startSlotHour; h <= maxSlotHour; h++) {
        const slotDate = new Date(now);
        slotDate.setHours(h, 0, 0, 0);

        const slotEnd = new Date(slotDate);
        slotEnd.setHours(h + 1, 0, 0, 0);

        if (slotDate < now || slotDate > windowEnd) {
          continue;
        }

        // Check if court slot is operating (06:00 to 22:00)
        const hourOfDay = slotDate.getHours();
        if (hourOfDay < 6 || hourOfDay >= 22) {
          continue;
        }

        const slotStartIso = slotDate.toISOString();
        const slotEndIso = slotEnd.toISOString();

        // 2. Check full slot availability (bookings & holds)
        const isFree = await waitlistRepository.checkSlotFullyAvailable(
          court.court_id,
          slotStartIso,
          slotEndIso
        );
        if (!isFree) {
          continue;
        }

        // 3. PRIORITY RULE: Waitlist has priority over public flash promotion!
        const hasWaitlist = await flashDealsRepository.hasActiveWaitlist(
          court.court_id,
          slotStartIso,
          slotEndIso
        );
        if (hasWaitlist) {
          continue; // Slot must be offered to waitlist, not public flash deal!
        }

        // 4. Calculate Truthful Quote
        const baseRate = parseFloat(court.base_price_per_hour);
        let originalPrice = baseRate;
        let finalPrice = baseRate;
        let isMemberDiscount = false;

        // Check if user is a member
        if (user && user.role === 'MEMBER') {
          const memRes = await pool.query(
            `SELECT mp.court_discount_pct 
             FROM user_memberships um 
             JOIN membership_plans mp ON um.plan_id = mp.id 
             WHERE um.user_id = $1 AND um.club_id = $2 AND um.is_active = TRUE AND um.expiry_date >= CURRENT_DATE
             LIMIT 1`,
            [user.id, court.club_id]
          );
          if (memRes.rows.length > 0) {
            // Fixed member discount applies to base rate (no flash stacking)
            const discountPct = parseFloat(memRes.rows[0].court_discount_pct);
            finalPrice = baseRate * (1 - discountPct / 100);
            originalPrice = baseRate;
            isMemberDiscount = true;
          }
        }

        if (!isMemberDiscount) {
          // Non-member: Check peak multiplier first
          const isPeak = hourOfDay >= 18 && hourOfDay < 22;
          originalPrice = isPeak ? baseRate * 1.25 : baseRate;

          // Apply flash discount percentage
          const flashDiscountPct = parseFloat(config.discount_pct);
          finalPrice = originalPrice * (1 - flashDiscountPct / 100);

          // Enforce price floor & ceiling
          const floor = parseFloat(config.price_floor || 400.0);
          if (finalPrice < floor) {
            finalPrice = floor;
          }
        }

        finalPrice = Math.round(finalPrice * 100) / 100;
        originalPrice = Math.round(originalPrice * 100) / 100;

        deals.push({
          courtId: court.court_id,
          courtName: court.court_name,
          sportType: court.sport_type,
          clubId: court.club_id,
          clubName: court.club_name,
          city: court.city,
          startTime: slotStartIso,
          endTime: slotEndIso,
          originalPrice,
          discountedPrice: finalPrice,
          savings: Math.max(0, Math.round((originalPrice - finalPrice) * 100) / 100),
          discountPct: Math.round(((originalPrice - finalPrice) / originalPrice) * 100),
          startsInMinutes: Math.round((slotDate.getTime() - now.getTime()) / (1000 * 60)),
          validUntil: slotStartIso,
          isMemberDiscount,
          nudgeMessage: isMemberDiscount
            ? 'Member Plan rate applied'
            : `Flash Deal: Save ${Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%! Starts in ${Math.round((slotDate.getTime() - now.getTime()) / (1000 * 60))}m`,
        });
      }
    }

    return deals;
  }

  /**
   * Book a flash deal slot with locked price confirmation
   */
  async bookFlashDeal(user, bookingDto) {
    const { courtId, startTime, endTime, paymentMode = 'UPI' } = bookingDto;

    // 1. Re-verify availability
    const isFree = await waitlistRepository.checkSlotFullyAvailable(courtId, startTime, endTime, user.id);
    if (!isFree) {
      const err = new Error('This flash deal slot is no longer available.');
      err.statusCode = 409;
      throw err;
    }

    // 2. Re-verify no active waitlist
    const hasWaitlist = await flashDealsRepository.hasActiveWaitlist(courtId, startTime, endTime);
    if (hasWaitlist) {
      const err = new Error('Slot has been prioritized for waitlisted customers.');
      err.statusCode = 409;
      throw err;
    }

    // 3. Delegate to BookingsService to enforce daily limit, lock price, and create booking
    const bookingsService = require('../bookings/bookings.service');
    return bookingsService.createBooking(user, {
      courtId,
      startTime,
      endTime,
      paymentMode,
    });
  }

  /**
   * Broadcast flash alert to opted-in users (safely deduplicated)
   */
  async broadcastFlashAlert(clubId, sportType, courtName, startTime, discountedPrice) {
    try {
      const usersRes = await pool.query(
        `SELECT u.id, u.email 
         FROM users u
         JOIN user_notification_preferences p ON u.id = p.user_id
         WHERE p.opt_in_flash_deals = TRUE 
           AND $1 = ANY(p.preferred_sports)
         LIMIT 20`,
        [sportType]
      );

      const slotTimeStr = new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      for (const recipient of usersRes.rows) {
        notificationsService.dispatchSafe({
          userId: recipient.id,
          clubId,
          type: 'FLASH_SALE',
          title: `⚡ Flash Deal: ${sportType} at ${slotTimeStr}`,
          message: `Last-minute opening on ${courtName}! Book now for only ₹${discountedPrice}.`,
          payload: { clubId, sportType, startTime, discountedPrice },
        });
      }
    } catch (err) {
      console.warn('[FlashDealsService] Broadcast alert error:', err.message);
    }
  }
}

module.exports = new FlashDealsService();
