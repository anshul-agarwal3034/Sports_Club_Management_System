const { sendError } = require('../utils/response');

function globalErrorHandler(err, req, res, next) {
  console.error('💥 Global Error Caught:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, err.errors || null);
}

module.exports = {
  globalErrorHandler,
};
