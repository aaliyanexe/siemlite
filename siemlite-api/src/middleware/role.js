const { error: apiError } = require('../utils/apiResponse');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return apiError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return apiError(res, 'FORBIDDEN', 'You do not have permission to perform this action', 403);
    }
    return next();
  };
}

module.exports = { requireRole };
