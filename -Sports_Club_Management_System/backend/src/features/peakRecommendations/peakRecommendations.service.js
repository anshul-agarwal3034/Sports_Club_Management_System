const { pool } = require('../../shared/database/db');
const peakRecommendationsRepository = require('./peakRecommendations.repository');

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class PeakRecommendationsService {
  /**
   * Analyze Historical Occupancy and Generate Truthful Recommendations
   */
  async generateRecommendations(clubId, sportType = 'Padel', days = 30) {
    const historicalData = await peakRecommendationsRepository.calculateHistoricalOccupancy(
      clubId,
      sportType,
      days
    );
    const currentRule = await peakRecommendationsRepository.getCurrentPricingRule(clubId, sportType);

    const currentMultiplier = currentRule ? parseFloat(currentRule.peak_multiplier || 1.25) : 1.0;
    const isAutopilot = currentRule ? !!currentRule.is_autopilot_enabled : false;
    const maxDelta = currentRule ? parseFloat(currentRule.max_auto_multiplier_delta || 0.1) : 0.1;

    const recommendations = [];

    // Analyze each weekday/hour bucket
    for (const item of historicalData) {
      const occupancy = parseFloat(item.occupancy_pct);
      const bookingsCount = parseInt(item.bookings_count, 10);

      // Require sufficient sample size (at least 3 sample bookings in the observation period)
      if (bookingsCount < 3) {
        continue;
      }

      let band = 'NORMAL';
      let proposedMultiplier = 1.0;

      if (occupancy < 35.0) {
        band = 'OFF_PEAK';
        proposedMultiplier = 0.9;
      } else if (occupancy >= 35.0 && occupancy < 65.0) {
        band = 'NORMAL';
        proposedMultiplier = 1.0;
      } else if (occupancy >= 65.0 && occupancy < 85.0) {
        band = 'PEAK';
        proposedMultiplier = 1.25;
      } else if (occupancy >= 85.0) {
        band = 'SUPER_PEAK';
        proposedMultiplier = 1.35;
      }

      // Check if current pricing matches proposed
      const isPeakHourInRule =
        currentRule &&
        item.hour_bucket >= currentRule.peak_start_hour &&
        item.hour_bucket < currentRule.peak_end_hour;

      const effectiveCurrentMultiplier = isPeakHourInRule ? currentMultiplier : 1.0;

      if (Math.abs(effectiveCurrentMultiplier - proposedMultiplier) >= 0.05) {
        const observationText = `${WEEKDAY_NAMES[item.weekday]}s at ${item.hour_bucket}:00 had ${occupancy}% occupancy across ${bookingsCount} bookings over the past ${days} days.`;

        // If autopilot is enabled, bound the change and apply
        let status = 'PENDING';
        let appliedMultiplier = proposedMultiplier;

        if (isAutopilot) {
          // Bounded step delta
          const delta = proposedMultiplier - effectiveCurrentMultiplier;
          const boundedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));
          appliedMultiplier = Math.round((effectiveCurrentMultiplier + boundedDelta) * 100) / 100;
          status = 'APPLIED_BY_AUTOPILOT';
        }

        const saved = await peakRecommendationsRepository.saveRecommendation({
          clubId,
          sportType,
          weekday: item.weekday,
          hourBucket: item.hour_bucket,
          observationPeriodDays: days,
          sampleSlotsCount: bookingsCount,
          occupancyPct: occupancy,
          occupancyBand: band,
          currentMultiplier: effectiveCurrentMultiplier,
          proposedMultiplier: appliedMultiplier,
          status,
          decisionNotes: isAutopilot
            ? `Autopilot applied bounded step of ${(appliedMultiplier - effectiveCurrentMultiplier).toFixed(2)}x`
            : null,
        });

        recommendations.push({
          id: saved.id,
          weekdayName: WEEKDAY_NAMES[item.weekday],
          hourBucket: item.hour_bucket,
          observationPeriodDays: days,
          sampleCount: bookingsCount,
          occupancyPct: occupancy,
          occupancyBand: band,
          currentMultiplier: effectiveCurrentMultiplier,
          proposedMultiplier: appliedMultiplier,
          status,
          observation: observationText,
        });
      }
    }

    return {
      clubId,
      sportType,
      observationPeriodDays: days,
      autopilotEnabled: isAutopilot,
      recommendationsCount: recommendations.length,
      recommendations,
    };
  }

  /**
   * Owner Reviews Recommendation (Approve or Reject)
   */
  async actionRecommendation(ownerUser, recId, action, notes = '') {
    if (ownerUser.role !== 'PLATFORM_ADMIN' && ownerUser.role !== 'CLUB_OWNER') {
      const err = new Error('Unauthorized: Only club owners and admins can approve pricing recommendations.');
      err.statusCode = 403;
      throw err;
    }

    const rec = await peakRecommendationsRepository.findRecommendationById(recId);
    if (!rec) {
      const err = new Error('Recommendation not found.');
      err.statusCode = 404;
      throw err;
    }

    if (rec.status !== 'PENDING') {
      const err = new Error(`Recommendation has already been actioned (status: '${rec.status}').`);
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      await peakRecommendationsRepository.updateRecommendationStatus(
        recId,
        newStatus,
        ownerUser.id,
        notes,
        client
      );

      // If approved and band is PEAK or SUPER_PEAK, adjust dynamic pricing rule
      if (action === 'APPROVE') {
        const currentRule = await peakRecommendationsRepository.getCurrentPricingRule(
          rec.club_id,
          rec.sport_type
        );
        if (currentRule) {
          const newStart = Math.min(currentRule.peak_start_hour, rec.hour_bucket);
          const newEnd = Math.max(currentRule.peak_end_hour, rec.hour_bucket + 1);
          await peakRecommendationsRepository.updateDynamicPricingPeakHours(
            rec.club_id,
            rec.sport_type,
            newStart,
            newEnd,
            rec.proposed_multiplier,
            client
          );
        }
      }

      await client.query('COMMIT');
      return {
        id: recId,
        status: newStatus,
        message: `Recommendation successfully ${newStatus.toLowerCase()}!`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Configure Autopilot Mode
   */
  async configureAutopilot(ownerUser, clubId, sportType, isEnabled, maxDelta = 0.1) {
    if (ownerUser.role !== 'PLATFORM_ADMIN' && ownerUser.role !== 'CLUB_OWNER') {
      const err = new Error('Unauthorized: Only club owners can configure autopilot.');
      err.statusCode = 403;
      throw err;
    }

    if (maxDelta <= 0 || maxDelta > 0.25) {
      const err = new Error('maxDelta must be between 0.01 and 0.25 (1% to 25%).');
      err.statusCode = 400;
      throw err;
    }

    return peakRecommendationsRepository.updateAutopilotSettings(
      clubId,
      sportType,
      isEnabled,
      maxDelta
    );
  }

  /**
   * Get pending recommendations for a club
   */
  async getClubRecommendations(clubId, status = 'PENDING') {
    return peakRecommendationsRepository.getRecommendationsForClub(clubId, status);
  }
}

module.exports = new PeakRecommendationsService();
