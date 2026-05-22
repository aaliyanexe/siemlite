const authRepo = require('./auth.repository');
const { comparePassword, hashPassword } = require('../../utils/bcrypt');
const {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshExpiryDate,
} = require('../../utils/jwt');
const { AppError } = require('../../middleware/errorHandler');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const REFRESH_COOKIE = 'refreshToken';

function sanitizeUser(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    force_pw_change: user.force_pw_change,
    last_login: user.last_login,
    created_at: user.created_at,
  };
}

function isAccountLocked(user) {
  return user.locked_until && new Date(user.locked_until) > new Date();
}

async function login(email, password) {
  const user = await authRepo.findByEmail(email);

  if (!user || !user.is_active) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  if (isAccountLocked(user)) {
    throw new AppError(
      'ACCOUNT_LOCKED',
      'Account temporarily locked due to failed login attempts. Try again later.',
      401
    );
  }

  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    let lockUntil = null;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_MINUTES);
    }
    await authRepo.recordFailedLogin(user.user_id, attempts, lockUntil);
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  await authRepo.recordSuccessfulLogin(user.user_id);

  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshExpiryDate();

  await authRepo.createRefreshToken(user.user_id, tokenHash, expiresAt);

  const publicUser = await authRepo.findById(user.user_id);

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(publicUser),
  };
}

async function refresh(refreshTokenRaw) {
  if (!refreshTokenRaw) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token required', 401);
  }

  const tokenHash = hashRefreshToken(refreshTokenRaw);
  const record = await authRepo.findValidRefreshToken(tokenHash);

  if (!record || !record.is_active) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401);
  }

  await authRepo.revokeRefreshToken(record.token_id);

  const user = await authRepo.findById(record.user_id);
  const accessToken = signAccessToken({
    user_id: user.user_id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken();
  const newHash = hashRefreshToken(newRefreshToken);
  const expiresAt = getRefreshExpiryDate();
  await authRepo.createRefreshToken(record.user_id, newHash, expiresAt);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: sanitizeUser(user),
  };
}

async function logout(refreshTokenRaw) {
  if (refreshTokenRaw) {
    const tokenHash = hashRefreshToken(refreshTokenRaw);
    await authRepo.revokeRefreshTokenByHash(tokenHash);
  }
}

async function changePassword(userId, currentPassword, newPassword) {
  const fullUser = await authRepo.findByIdWithPassword(userId);

  if (!fullUser || !fullUser.is_active) {
    throw new AppError('UNAUTHORIZED', 'User not found or inactive', 401);
  }

  const valid = await comparePassword(currentPassword, fullUser.password_hash);

  if (!valid) {
    throw new AppError('INVALID_CREDENTIALS', 'Current password is incorrect', 401);
  }

  const newHash = await hashPassword(newPassword);
  await authRepo.updatePassword(userId, newHash, true);
  await authRepo.revokeAllUserRefreshTokens(userId);

  return { message: 'Password updated successfully' };
}

function getRefreshCookieOptions() {
  const secure = process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  };
}

function getClearCookieOptions() {
  return { ...getRefreshCookieOptions(), maxAge: 0 };
}

module.exports = {
  login,
  refresh,
  logout,
  changePassword,
  REFRESH_COOKIE,
  getRefreshCookieOptions,
  getClearCookieOptions,
  sanitizeUser,
};
