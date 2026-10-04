const { sendError } = require('../utils/response');

/**
 * Multi-Tenant Club Data Isolation Middleware
 * Guarantees a Club Owner or Staff member cannot query or mutate another club's data
 */
function enforceClubIsolation(req, res, next) {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  const { role, clubId } = req.user;

  // Platform Admins can access all clubs
  if (role === 'PLATFORM_ADMIN') {
    return next();
  }

  const targetClubId = req.params.clubId || req.body.clubId || req.query.clubId;

  if (targetClubId && targetClubId !== clubId) {
    return sendError(
      res,
      'Access Denied: You are not authorized to view or modify data for another club.',
      403
    );
  }

  next();
}

module.exports = {
  enforceClubIsolation,
};
