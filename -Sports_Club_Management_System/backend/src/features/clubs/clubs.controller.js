const clubsService = require('./clubs.service');
const { RegisterClubSchema, VerifyClubSchema, validate } = require('./clubs.validator');
const { sendSuccess } = require('../../shared/utils/response');

class ClubsController {
  /**
   * POST /api/v1/clubs/register
   * Club Onboarding Wizard (Registers Club, Owner, Courts, Plans & Dynamic Pricing)
   */
  async registerClub(req, res, next) {
    try {
      const validatedData = validate(RegisterClubSchema, req.body);
      const result = await clubsService.registerClub(validatedData, req.user);
      return sendSuccess(res, result, result.message, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/clubs
   * Club Discovery (List clubs with city / verified filters)
   */
  async listClubs(req, res, next) {
    try {
      const city = req.query.city;
      const verifiedOnly = req.query.verified === 'true';
      const clubs = await clubsService.listClubs(city, verifiedOnly);
      return sendSuccess(res, clubs, 'Clubs retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/clubs/admin/pending
   * Platform Admin View: Get All Pending / Unverified Clubs
   */
  async getPendingClubs(req, res, next) {
    try {
      const clubs = await clubsService.getPendingClubs();
      return sendSuccess(res, clubs, 'Pending unverified clubs retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/clubs/:id
   * Get Full Club Profile
   */
  async getClubDetails(req, res, next) {
    try {
      const clubId = req.params.id;
      const club = await clubsService.getClubDetails(clubId);
      return sendSuccess(res, club, 'Club profile fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/clubs/:id/verify
   * Platform Admin Verification & Inspection Update
   */
  async verifyClub(req, res, next) {
    try {
      const clubId = req.params.id;
      const validatedData = validate(VerifyClubSchema, req.body);
      const result = await clubsService.verifyClub(clubId, validatedData);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/clubs/:id/setup/status
   */
  async getSetupStatus(req, res, next) {
    try {
      const clubId = req.params.id;
      const status = await clubsService.getSetupStatus(req.user, clubId);
      return sendSuccess(res, status, 'Setup status fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/clubs/:id/setup/draft
   */
  async saveSetupDraft(req, res, next) {
    try {
      const clubId = req.params.id;
      const { step, draftData } = req.body;
      const saved = await clubsService.saveSetupDraft(req.user, clubId, step, draftData);
      return sendSuccess(res, saved, 'Setup draft saved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/clubs/:id/setup/submit
   */
  async submitSetupApplication(req, res, next) {
    try {
      const clubId = req.params.id;
      const result = await clubsService.submitSetupApplication(req.user, clubId, req.body);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/clubs/:id/settings
   */
  async getClubSettings(req, res, next) {
    try {
      const clubId = req.params.id;
      const settings = await clubsService.getClubSettings(req.user, clubId);
      return sendSuccess(res, settings, 'Club settings fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/clubs/:id/settings
   */
  async updateClubSettings(req, res, next) {
    try {
      const clubId = req.params.id;
      const result = await clubsService.updateClubSettings(req.user, clubId, req.body);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/clubs/:id/sports
   */
  async getClubSports(req, res, next) {
    try {
      const clubId = req.params.id;
      const sports = await clubsService.getClubSports(clubId);
      return sendSuccess(res, sports, 'Club sports retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/clubs/:id/sports
   */
  async addClubSport(req, res, next) {
    try {
      const clubId = req.params.id;
      const sport = await clubsService.addClubSport(req.user, clubId, req.body);
      return sendSuccess(res, sport, 'Sport added successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/clubs/:id/sports/:sportId
   */
  async updateClubSport(req, res, next) {
    try {
      const { id: clubId, sportId } = req.params;
      const sport = await clubsService.updateClubSport(req.user, clubId, sportId, req.body);
      return sendSuccess(res, sport, 'Sport updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/clubs/:id/sports/:sportId
   */
  async archiveClubSport(req, res, next) {
    try {
      const { id: clubId, sportId } = req.params;
      const result = await clubsService.archiveClubSport(req.user, clubId, sportId);
      return sendSuccess(res, result, 'Sport archived successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/clubs/:id/courts
   */
  async addCourt(req, res, next) {
    try {
      const clubId = req.params.id;
      const court = await clubsService.addCourt(req.user, clubId, req.body);
      return sendSuccess(res, court, 'Court created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/clubs/:id/courts/:courtId
   */
  async updateCourt(req, res, next) {
    try {
      const { id: clubId, courtId } = req.params;
      const result = await clubsService.updateCourt(req.user, clubId, courtId, req.body);
      return sendSuccess(res, result, 'Court updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/clubs/:id/courts/:courtId
   */
  async archiveCourt(req, res, next) {
    try {
      const { id: clubId, courtId } = req.params;
      const result = await clubsService.archiveCourt(req.user, clubId, courtId);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async getClubCourts(req, res, next) {
    try {
      const clubId = req.params.id;
      const courts = await clubsService.getClubCourts(clubId);
      return sendSuccess(res, courts, 'Courts retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getClubUsers(req, res, next) {
    try {
      const clubId = req.params.id;
      const users = await clubsService.getClubUsers(clubId);
      return sendSuccess(res, users, 'Club users retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getClubEmployees(req, res, next) {
    try {
      const clubId = req.params.id;
      const employees = await clubsService.getClubEmployees(clubId);
      return sendSuccess(res, employees, 'Club employees retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async updateEmployeeStatus(req, res, next) {
    try {
      const clubId = req.params.id;
      const employeeId = req.params.employeeId;
      const { status } = req.body;
      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        const err = new Error('Invalid status. Must be APPROVED, REJECTED, or PENDING.');
        err.statusCode = 400;
        throw err;
      }
      const updated = await clubsService.updateEmployeeStatus(clubId, employeeId, status, req.user);
      return sendSuccess(res, updated, `Employee status updated to ${status}`, 200);
    } catch (err) {
      next(err);
    }
  }

  async getClubLeads(req, res, next) {
    try {
      const clubId = req.params.id;
      const leads = await clubsService.getClubLeads(clubId);
      return sendSuccess(res, leads, 'Club leads retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async createClubLead(req, res, next) {
    try {
      const clubId = req.params.id;
      const lead = await clubsService.createClubLead(clubId, req.body);
      return sendSuccess(res, lead, 'Lead created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateClubLead(req, res, next) {
    try {
      const { id: clubId, leadId } = req.params;
      const { status } = req.body;
      const lead = await clubsService.updateClubLead(clubId, leadId, status);
      return sendSuccess(res, lead, 'Lead status updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getClubTransactions(req, res, next) {
    try {
      const clubId = req.params.id;
      const transactions = await clubsService.getClubTransactions(clubId);
      return sendSuccess(res, transactions, 'Transactions retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getClubComplaints(req, res, next) {
    try {
      const clubId = req.params.id;
      const complaints = await clubsService.getClubComplaints(clubId);
      return sendSuccess(res, complaints, 'Complaints retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async createClubComplaint(req, res, next) {
    try {
      const clubId = req.params.id;
      const complaint = await clubsService.createClubComplaint(clubId, req.body);
      return sendSuccess(res, complaint, 'Complaint recorded', 201);
    } catch (err) {
      next(err);
    }
  }

  async getClubEvents(req, res, next) {
    try {
      const clubId = req.params.id;
      const events = await clubsService.getClubEvents(clubId);
      return sendSuccess(res, events, 'Events retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async createClubEvent(req, res, next) {
    try {
      const clubId = req.params.id;
      const event = await clubsService.createClubEvent(clubId, req.body);
      return sendSuccess(res, event, 'Event created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClubsController();
