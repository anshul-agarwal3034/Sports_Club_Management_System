const { sendError } = require('../utils/response');

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param {Array<string>} allowedRoles List of roles permitted to access the route
 */
function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'User context not found. Authentication required.', 401);
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return sendError(
        res,
        `Access Forbidden: Role '${role}' is not authorized to access this resource.`,
        403
      );
    }

    next();
  };
}

module.exports = {
  requireRoles,
};
