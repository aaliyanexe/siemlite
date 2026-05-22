const { verifyAccessToken } = require('../utils/jwt');
const { error: apiError } = require('../utils/apiResponse');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return apiError(res, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: parseInt(payload.sub, 10),
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return apiError(res, 'UNAUTHORIZED', 'Invalid or expired access token', 401);
  }
}

module.exports = { authenticate };
