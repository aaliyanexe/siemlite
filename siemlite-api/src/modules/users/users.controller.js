const usersService = require('./users.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try {
    const result = await usersService.listUsers(req.query);
    return success(res, result.users, 'Users retrieved', 200, result.pagination);
  } catch (err) { return next(err); }
}

async function getMe(req, res, next) {
  try {
    const user = await usersService.getMe(req.user.userId);
    return success(res, user, 'Profile retrieved');
  } catch (err) { return next(err); }
}

async function getById(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.id);
    return success(res, user, 'User retrieved');
  } catch (err) { return next(err); }
}

async function create(req, res, next) {
  try {
    const user = await usersService.createUser(req.body);
    return success(res, user, 'User created', 201);
  } catch (err) { return next(err); }
}

async function update(req, res, next) {
  try {
    const user = await usersService.updateUser(req.params.id, req.body, req.user.userId);
    return success(res, user, 'User updated');
  } catch (err) { return next(err); }
}

async function deactivate(req, res, next) {
  try {
    const user = await usersService.deactivateUser(req.params.id, req.user.userId);
    return success(res, user, 'User deactivated');
  } catch (err) { return next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const user = await usersService.resetUserPassword(req.params.id, req.body.password);
    return success(res, user, 'Password reset successfully');
  } catch (err) { return next(err); }
}

// ── NEW ───────────────────────────────────────────────────────────────────────
async function changePassword(req, res, next) {
  try {
    const user = await usersService.changePassword(
      req.user.userId,
      req.body.current_password,
      req.body.new_password,
    );
    return success(res, user, 'Password changed successfully');
  } catch (err) { return next(err); }
}

module.exports = { list, getMe, getById, create, update, deactivate, resetPassword, changePassword };