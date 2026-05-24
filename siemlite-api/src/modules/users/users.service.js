const usersRepo = require('./users.repository');
const { hashPassword, comparePassword } = require('../../utils/bcrypt');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const { AppError } = require('../../middleware/errorHandler');

function formatUser(user) {
  if (!user) return null;
  return {
    user_id:            user.user_id,
    name:               user.is_active ? user.name : `${user.name} [Deactivated]`,
    email:              user.email,
    role:               user.role,
    is_active:          user.is_active,
    force_pw_change:    user.force_pw_change,
    last_login:         user.last_login,
    created_at:         user.created_at,
    open_incident_count: user.open_incident_count ?? 0,
  };
}

async function listUsers(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await usersRepo.findAll({
    role:   query.role,
    status: query.status,
    limit,
    offset,
  });
  return {
    users:      rows.map(formatUser),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getUserById(userId) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', `User with id ${userId} does not exist`, 404);
  return formatUser(user);
}

async function getMe(userId) {
  return getUserById(userId);
}

async function createUser(data) {
  const existing = await usersRepo.findByEmail(data.email);
  if (existing) throw new AppError('EMAIL_EXISTS', 'Email is already registered', 409);
  const passwordHash = await hashPassword(data.password);
  const user = await usersRepo.create({ name: data.name, email: data.email, passwordHash, role: data.role });
  return formatUser(user);
}

async function updateUser(userId, data, actingUserId) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', `User with id ${userId} does not exist`, 404);

  if (data.email && data.email !== user.email) {
    const existing = await usersRepo.findByEmail(data.email, userId);
    if (existing) throw new AppError('EMAIL_EXISTS', 'Email is already registered', 409);
  }

  if (data.role === 'Analyst' && user.role === 'Admin') {
    const adminCount = await usersRepo.countActiveAdmins();
    if (adminCount <= 1) throw new AppError('LAST_ADMIN', 'Cannot demote the only active Admin', 403);
  }

  const updated = await usersRepo.update(userId, { name: data.name, email: data.email, role: data.role });
  return formatUser(updated);
}

async function deactivateUser(userId, actingUserId) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', `User with id ${userId} does not exist`, 404);
  if (!user.is_active) throw new AppError('USER_INACTIVE', 'User is already deactivated', 400);
  if (userId === actingUserId) throw new AppError('CANNOT_DEACTIVATE_SELF', 'Cannot deactivate your own account', 403);
  if (user.role === 'Admin') {
    const adminCount = await usersRepo.countActiveAdmins();
    if (adminCount <= 1) throw new AppError('LAST_ADMIN', 'Cannot deactivate the only active Admin', 403);
  }
  const updated = await usersRepo.deactivate(userId);
  return formatUser(updated);
}

async function resetUserPassword(userId, password) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new AppError('USER_NOT_FOUND', `User with id ${userId} does not exist`, 404);
  const passwordHash = await hashPassword(password);
  const updated = await usersRepo.resetPassword(userId, passwordHash);
  return formatUser(updated);
}

// ── NEW: self-service password change ─────────────────────────────────────────
async function changePassword(userId, currentPassword, newPassword) {
  // Get raw user with password hash
  const { query } = require('../../config/db');
  const result = await query(
    `SELECT user_id, password_hash FROM users WHERE user_id = $1`, [userId]
  );
  const raw = result.rows[0];
  if (!raw) throw new AppError('USER_NOT_FOUND', 'User not found', 404);

  const valid = await comparePassword(currentPassword, raw.password_hash);
  if (!valid) throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 401);

  const newHash = await hashPassword(newPassword);
  await query(
    `UPDATE users SET password_hash = $2, force_pw_change = FALSE WHERE user_id = $1`,
    [userId, newHash]
  );

  return getUserById(userId);
}

module.exports = {
  listUsers,
  getUserById,
  getMe,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
  changePassword,
  formatUser,
};