const { error: apiError } = require('../utils/apiResponse');

class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFoundHandler(req, res) {
  return apiError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
}

function errorHandler(err, req, res, _next) {
  if (err.isOperational) {
    return apiError(res, err.code, err.message, err.statusCode);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return apiError(res, 'INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  console.error(err);

  const isProd = process.env.NODE_ENV === 'production';
  return apiError(
    res,
    'INTERNAL_ERROR',
    isProd ? 'An unexpected error occurred' : err.message,
    500
  );
}

module.exports = { AppError, notFoundHandler, errorHandler };
