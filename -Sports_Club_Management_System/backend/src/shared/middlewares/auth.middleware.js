const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication token missing or invalid', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, role, clubId }
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

module.exports = {
  authenticate,
};
