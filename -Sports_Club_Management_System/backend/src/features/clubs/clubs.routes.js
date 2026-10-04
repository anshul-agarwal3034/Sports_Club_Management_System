const express = require('express');
const clubsController = require('./clubs.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');

const { verifyToken } = require('../../shared/utils/jwt');

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch {
      // ignore
    }
  }
  next();
}

const router = express.Router();

// Public Club Onboarding & Discovery Endpoints
router.post('/register', optionalAuthenticate, (req, res, next) => clubsController.registerClub(req, res, next));
router.get('/', (req, res, next) => clubsController.listClubs(req, res, next));

// Platform Admin Endpoints (RBAC Protected)
router.get(
  '/admin/pending',
  authenticate,
  requireRoles(['PLATFORM_ADMIN']),
  (req, res, next) => clubsController.getPendingClubs(req, res, next)
);

router.post(
  '/:id/verify',
  authenticate,
  requireRoles(['PLATFORM_ADMIN']),
  (req, res, next) => clubsController.verifyClub(req, res, next)
);

// Setup Draft & Submission
router.get('/:id/setup/status', authenticate, (req, res, next) => clubsController.getSetupStatus(req, res, next));
router.put('/:id/setup/draft', authenticate, (req, res, next) => clubsController.saveSetupDraft(req, res, next));
router.post('/:id/setup/submit', authenticate, (req, res, next) => clubsController.submitSetupApplication(req, res, next));

// Settings
router.get('/:id/settings', authenticate, (req, res, next) => clubsController.getClubSettings(req, res, next));
router.put('/:id/settings', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.updateClubSettings(req, res, next));

// Sports & Facilities
router.get('/:id/sports', (req, res, next) => clubsController.getClubSports(req, res, next));
router.post('/:id/sports', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.addClubSport(req, res, next));
router.put('/:id/sports/:sportId', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.updateClubSport(req, res, next));
router.delete('/:id/sports/:sportId', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.archiveClubSport(req, res, next));

// Courts
router.get('/:id/courts', (req, res, next) => clubsController.getClubCourts(req, res, next));
router.post('/:id/courts', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.addCourt(req, res, next));
router.put('/:id/courts/:courtId', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.updateCourt(req, res, next));
router.delete('/:id/courts/:courtId', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.archiveCourt(req, res, next));

// Members & Staff
router.get('/:id/users', authenticate, (req, res, next) => clubsController.getClubUsers(req, res, next));
router.get('/:id/employees', authenticate, (req, res, next) => clubsController.getClubEmployees(req, res, next));
router.put('/:id/employees/:employeeId/status', authenticate, requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']), (req, res, next) => clubsController.updateEmployeeStatus(req, res, next));

// CRM Leads
router.get('/:id/leads', authenticate, (req, res, next) => clubsController.getClubLeads(req, res, next));
router.post('/:id/leads', authenticate, (req, res, next) => clubsController.createClubLead(req, res, next));
router.patch('/:id/leads/:leadId', authenticate, (req, res, next) => clubsController.updateClubLead(req, res, next));

// Transactions
router.get('/:id/transactions', authenticate, (req, res, next) => clubsController.getClubTransactions(req, res, next));

// Complaints / Feedback
router.get('/:id/complaints', authenticate, (req, res, next) => clubsController.getClubComplaints(req, res, next));
router.post('/:id/complaints', authenticate, (req, res, next) => clubsController.createClubComplaint(req, res, next));

// Events
router.get('/:id/events', (req, res, next) => clubsController.getClubEvents(req, res, next));
router.post('/:id/events', authenticate, (req, res, next) => clubsController.createClubEvent(req, res, next));

// Public Full Profile Endpoint (must be below specific sub-paths like /admin/pending)
router.get('/:id', (req, res, next) => clubsController.getClubDetails(req, res, next));

module.exports = router;
