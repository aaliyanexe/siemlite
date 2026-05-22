const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getEnv } = require('../config/env');

function signAccessToken(user) {
  const { JWT_SECRET, JWT_ACCESS_EXPIRY } = getEnv();
  return jwt.sign(
    {
      sub: String(user.user_id),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: JWT_ACCESS_EXPIRY }
  );
}

function verifyAccessToken(token) {
  const { JWT_SECRET } = getEnv();
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiryDate() {
  const days = 7;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshExpiryDate,
};
