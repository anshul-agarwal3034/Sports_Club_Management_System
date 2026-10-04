const bcrypt = require('bcrypt');
const clubsRepository = require('./clubs.repository');
const authRepository = require('../auth/auth.repository');
const { generateToken } = require('../../shared/utils/jwt');

class ClubsService {
  /**
   * Register & Onboard a new Club with Owner, Courts, Plans & Dynamic Pricing
   */
  async registerClub(registerDto, requestingUser = null) {
    const {
      name,
      address,
      city,
      gstNumber,
      panNumber,
      ownerInfo,
      courts,
      membershipPlans,
      dynamicPricing,
    } = registerDto;

    let ownerData = {};
    if (requestingUser) {
      ownerData = {
        existingUserId: requestingUser.id,
      };
    } else if (ownerInfo && ownerInfo.password) {
      const existingOwner = await authRepository.findByEmail(ownerInfo.email);
      if (existingOwner) {
        const err = new Error('An account with this owner email already exists.');
        err.statusCode = 409;
        throw err;
      }
      const passwordHash = await bcrypt.hash(ownerInfo.password, 10);
      ownerData = {
        ...ownerInfo,
        passwordHash,
      };
    } else {
      const err = new Error('Authentication is required to setup or register a club. Please log in first.');
      err.statusCode = 401;
      throw err;
    }

    // 3. Prepare Default Membership Plans if omitted by onboarding wizard
    const defaultPlans = [
      {
        tier: 'GOLD',
        price: 4999.0,
        durationMonths: 3,
        courtDiscountPct: 50.0,
        rentalDiscountPct: 50.0,
        shopDiscountPct: 10.0,
        foodDiscountPct: 0.0,
        allowsPayLater: true,
        freeCoachingSessionsPerMonth: 4,
      },
      {
        tier: 'SILVER',
        price: 2499.0,
        durationMonths: 3,
        courtDiscountPct: 25.0,
        rentalDiscountPct: 25.0,
        shopDiscountPct: 5.0,
        foodDiscountPct: 0.0,
        allowsPayLater: false,
        freeCoachingSessionsPerMonth: 0,
      },
      {
        tier: 'JUNIOR',
        price: 1999.0,
        durationMonths: 3,
        courtDiscountPct: 30.0,
        rentalDiscountPct: 30.0,
        shopDiscountPct: 5.0,
        foodDiscountPct: 0.0,
        allowsPayLater: false,
        freeCoachingSessionsPerMonth: 0,
      },
    ];

    const finalPlans = membershipPlans && membershipPlans.length >= 3 ? membershipPlans : defaultPlans;

    // 4. Extract Sports & Prepare Dynamic Pricing Rules
    const courtList = courts && courts.length > 0 ? courts : [
      { name: 'Court 1 - Main', sportType: 'Padel', basePricePerHour: 800, maxCapacity: 4 }
    ];
    const uniqueSports = [...new Set(courtList.map((c) => c.sportType))];
    const defaultPricing = uniqueSports.map((sport) => {
      const courtSample = courtList.find((c) => c.sportType === sport);
      const basePrice = courtSample ? courtSample.basePricePerHour : 800;

      return {
        sportType: sport,
        isEnabled: true,
        strategy: 'BALANCED',
        peakStartHour: 18,
        peakEndHour: 22,
        peakMultiplier: 1.25,
        priceFloor: basePrice * 0.5,
        priceCeiling: basePrice * 1.5,
        lastMinuteDiscountPct: 15,
      };
    });

    const finalPricing = dynamicPricing && dynamicPricing.length > 0 ? dynamicPricing : defaultPricing;

    // 5. Execute Transactional Creation in Repository
    const result = await clubsRepository.createClubWithDetails(
      { name, address, city, gstNumber, panNumber },
      ownerData,
      courtList,
      finalPlans,
      finalPricing
    );

    // 6. Generate Token for Owner
    const token = generateToken({
      id: result.owner.id,
      email: result.owner.email,
      role: result.owner.role,
      clubId: result.club.id,
    });

    return {
      club: result.club,
      owner: result.owner,
      courts: result.courts,
      membershipPlans: result.membershipPlans,
      dynamicPricing: result.dynamicPricing,
      token,
      message: 'Club onboarded successfully! Pending physical inspection for Verified badge.',
    };
  }

  /**
   * Get Full Details for a Club
   */
  async getClubDetails(clubId) {
    const club = await clubsRepository.findClubById(clubId);
    if (!club) {
      const err = new Error(`Club with ID '${clubId}' not found.`);
      err.statusCode = 404;
      throw err;
    }
    return club;
  }

  /**
   * Discovery API: List all clubs
   */
  async listClubs(city = null, verifiedOnly = false) {
    return clubsRepository.listClubs(city, verifiedOnly);
  }

  /**
   * Platform Admin API: Get all pending / unverified clubs awaiting verification
   */
  async getPendingClubs() {
    return clubsRepository.findPendingClubs();
  }

  /**
   * Platform Admin Inspection & Verification Update
   */
  async verifyClub(clubId, verifyDto) {
    const club = await clubsRepository.findClubById(clubId);
    if (!club) {
      const err = new Error(`Club with ID '${clubId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const { isVerified, inspectionStatus, baseCommissionPct } = verifyDto;
    const updated = await clubsRepository.updateVerification(
      clubId,
      isVerified,
      inspectionStatus,
      baseCommissionPct
    );

    return {
      club: updated,
      message: isVerified
        ? 'Club status updated to VERIFIED. Verified badge awarded!'
        : 'Club verification updated.',
    };
  }

  /**
   * Save Setup Draft Progress
   */
  async saveSetupDraft(requestingUser, clubId, step, draftData) {
    let targetClubId = clubId;
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const userRes = await authRepository.findById(requestingUser.id);
      if (userRes && (!userRes.club_id || userRes.club_id === clubId || userRes.clubId === clubId)) {
        targetClubId = clubId;
        if (!userRes.club_id) {
          const { query } = require('../../shared/database/db');
          await query('UPDATE users SET club_id = $1, role = $2 WHERE id = $3', [clubId, 'CLUB_OWNER', requestingUser.id]);
        }
      } else {
        const err = new Error('Unauthorized to modify setup draft for this club.');
        err.statusCode = 403;
        throw err;
      }
    }

    return await clubsRepository.saveSetupDraft(targetClubId, step, draftData);
  }

  /**
   * Get Setup Status & Draft
   */
  async getSetupStatus(requestingUser, clubId) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const userRes = await authRepository.findById(requestingUser.id);
      if (!userRes || (userRes.club_id && userRes.club_id !== clubId && userRes.clubId !== clubId)) {
        const err = new Error('Unauthorized to view setup status for this club.');
        err.statusCode = 403;
        throw err;
      }
    }

    const status = await clubsRepository.getSetupStatus(clubId);
    if (!status) {
      const err = new Error('Club not found.');
      err.statusCode = 404;
      throw err;
    }
    return status;
  }

  /**
   * Submit Setup Application with Comprehensive Validation
   */
  async submitSetupApplication(requestingUser, clubId, submissionData) {
    let targetClubId = clubId;
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const userRes = await authRepository.findById(requestingUser.id);
      if (userRes && (!userRes.club_id || userRes.club_id === clubId || userRes.clubId === clubId)) {
        targetClubId = clubId;
        if (!userRes.club_id) {
          const { query } = require('../../shared/database/db');
          await query('UPDATE users SET club_id = $1, role = $2 WHERE id = $3', [clubId, 'CLUB_OWNER', requestingUser.id]);
        }
      } else {
        const err = new Error('Unauthorized to submit setup application for this club.');
        err.statusCode = 403;
        throw err;
      }
    }

    // Step 1 Validation
    if (!submissionData.clubName || !submissionData.address || !submissionData.city) {
      const missing = [];
      if (!submissionData.clubName) missing.push('Club Name');
      if (!submissionData.address) missing.push('Street Address');
      if (!submissionData.city) missing.push('City');
      const err = new Error(`Step 1 Incomplete: ${missing.join(', ')} required.`);
      err.statusCode = 400;
      throw err;
    }

    // Step 2 Validation: Minimum 3 images required for each sport!
    if (!Array.isArray(submissionData.sports) || submissionData.sports.length === 0) {
      const err = new Error('Step 2 Incomplete: You must configure at least one sport section.');
      err.statusCode = 400;
      throw err;
    }

    for (const sport of submissionData.sports) {
      if (!sport.sportName) {
        const err = new Error('Step 2 Incomplete: Each sport section must have a sport selected.');
        err.statusCode = 400;
        throw err;
      }
      const imgCount = Array.isArray(sport.images) ? sport.images.length : 0;
      if (imgCount < 3) {
        const err = new Error(
          `Validation failed for ${sport.sportName}: At least THREE (3) uploaded photos are required for each sport section before submission (current: ${imgCount}).`
        );
        err.statusCode = 400;
        throw err;
      }
      if (!Array.isArray(sport.courts) || sport.courts.length === 0) {
        const err = new Error(`Validation failed for ${sport.sportName}: At least one court/playing area must be added.`);
        err.statusCode = 400;
        throw err;
      }
      for (const court of sport.courts) {
        const cName = court.name || court.courtName;
        const cPrice = court.basePricePerHour || court.hourlyRate || court.price;
        if (!cName) {
          const err = new Error(`Validation failed for ${sport.sportName}: Court name is required.`);
          err.statusCode = 400;
          throw err;
        }
        if (!cPrice || Number(cPrice) <= 0) {
          const err = new Error(`Validation failed for ${cName}: Base hourly price must be greater than zero.`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    // Step 4 Validation: Legal entity & GST
    if (!submissionData.legalBusinessName || !submissionData.businessType) {
      const err = new Error('Step 4 Incomplete: Legal business entity name and business type are required.');
      err.statusCode = 400;
      throw err;
    }

    if (submissionData.gstRegistered && !submissionData.gstNumber) {
      const err = new Error('Step 4 Incomplete: GSTIN is required when GST registration status is declared as Registered.');
      err.statusCode = 400;
      throw err;
    }

    const updated = await clubsRepository.submitSetupApplication(targetClubId, submissionData);
    return {
      club: updated,
      message: 'Club application submitted successfully! Status is now PENDING_REVIEW.',
    };
  }

  /**
   * Get Club Settings (Protected & Masked)
   */
  async getClubSettings(requestingUser, clubId) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized access to club settings.');
      err.statusCode = 403;
      throw err;
    }

    const isAuthorized = requestingUser.role === 'PLATFORM_ADMIN' || requestingUser.role === 'CLUB_OWNER';
    return await clubsRepository.getClubSettings(clubId, !isAuthorized);
  }

  /**
   * Update Club Settings
   */
  async updateClubSettings(requestingUser, clubId, settingsData) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized to modify settings for this club.');
      err.statusCode = 403;
      throw err;
    }

    // Prevent changing platform commission rate through client controls
    delete settingsData.baseCommissionPct;
    delete settingsData.base_commission_pct;

    const updated = await clubsRepository.updateClubSettings(clubId, settingsData);
    return {
      club: updated,
      message: 'Club settings updated successfully.',
    };
  }

  /**
   * Get All Sport Sections for a Club
   */
  async getClubSports(clubId) {
    return await clubsRepository.getClubSports(clubId);
  }

  /**
   * Add Sport Section
   */
  async addClubSport(requestingUser, clubId, sportData) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }

    const imgCount = Array.isArray(sportData.images) ? sportData.images.length : 0;
    if (imgCount < 3) {
      const err = new Error('At least THREE (3) uploaded facility photos are required for each sport section.');
      err.statusCode = 400;
      throw err;
    }

    return await clubsRepository.addClubSport(clubId, sportData);
  }

  /**
   * Update Sport Section
   */
  async updateClubSport(requestingUser, clubId, sportId, sportData) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }

    return await clubsRepository.updateClubSport(clubId, sportId, sportData);
  }

  /**
   * Archive Sport Section
   */
  async archiveClubSport(requestingUser, clubId, sportId) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }

    return await clubsRepository.archiveClubSport(clubId, sportId);
  }

  /**
   * Add Court
   */
  async addCourt(requestingUser, clubId, courtData) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }

    return await clubsRepository.addCourt(clubId, courtData);
  }

  /**
   * Update Court with Warning on Future Bookings
   */
  async updateCourt(requestingUser, clubId, courtId, courtData) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }

    const futureBookings = await clubsRepository.getFutureBookingsCount(courtId);
    let warning = null;
    if (courtData.status && courtData.status !== 'ACTIVE' && futureBookings > 0) {
      warning = `Warning: This court has ${futureBookings} confirmed future bookings that will be impacted by setting status to '${courtData.status}'.`;
    }

    const updated = await clubsRepository.updateCourt(clubId, courtId, courtData);
    return {
      court: updated,
      futureBookingsCount: futureBookings,
      warning,
    };
  }

  /**
   * Archive Court
   */
  async archiveCourt(requestingUser, clubId, courtId) {
    if (requestingUser.role !== 'PLATFORM_ADMIN' && requestingUser.clubId !== clubId) {
      const err = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }

    const futureBookings = await clubsRepository.getFutureBookingsCount(courtId);
    await clubsRepository.archiveCourt(clubId, courtId);
    return {
      message: 'Court archived successfully (historical bookings preserved).',
      futureBookingsCount: futureBookings,
      warning: futureBookings > 0 ? `Court had ${futureBookings} future bookings.` : null,
    };
  }

  async getClubCourts(clubId) {
    return await clubsRepository.getClubCourts(clubId);
  }

  async getClubUsers(clubId) {
    return await clubsRepository.getClubUsers(clubId);
  }

  async getClubEmployees(clubId) {
    return await clubsRepository.getClubEmployees(clubId);
  }

  async updateEmployeeStatus(clubId, employeeId, status, requestingUser) {
    if (requestingUser && requestingUser.role !== 'CLUB_OWNER' && requestingUser.role !== 'PLATFORM_ADMIN') {
      const err = new Error('Unauthorized: Only club owners can verify or update staff/coach statuses.');
      err.statusCode = 403;
      throw err;
    }
    const updated = await clubsRepository.updateEmployeeStatus(clubId, employeeId, status);
    if (!updated) {
      const err = new Error('Employee record not found for this club.');
      err.statusCode = 404;
      throw err;
    }
    return updated;
  }

  async getClubLeads(clubId) {
    return await clubsRepository.getClubLeads(clubId);
  }

  async createClubLead(clubId, leadData) {
    return await clubsRepository.createClubLead(clubId, leadData);
  }

  async updateClubLead(clubId, leadId, status) {
    return await clubsRepository.updateClubLead(clubId, leadId, status);
  }

  async getClubTransactions(clubId) {
    return await clubsRepository.getClubTransactions(clubId);
  }

  async getClubComplaints(clubId) {
    return await clubsRepository.getClubComplaints(clubId);
  }

  async createClubComplaint(clubId, complaintData) {
    return await clubsRepository.createClubComplaint(clubId, complaintData);
  }

  async getClubEvents(clubId) {
    return await clubsRepository.getClubEvents(clubId);
  }

  async createClubEvent(clubId, eventData) {
    return await clubsRepository.createClubEvent(clubId, eventData);
  }
}

module.exports = new ClubsService();
