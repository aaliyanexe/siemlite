const authService = require('./auth.service');
const { success } = require('../../utils/apiResponse');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie(
      authService.REFRESH_COOKIE,
      result.refreshToken,
      authService.getRefreshCookieOptions()
    );

    return success(
      res,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      'Login successful'
    );
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies[authService.REFRESH_COOKIE];
    const result = await authService.refresh(refreshToken);

    res.cookie(
      authService.REFRESH_COOKIE,
      result.refreshToken,
      authService.getRefreshCookieOptions()
    );

    return success(
      res,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      'Token refreshed'
    );
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies[authService.REFRESH_COOKIE];
    await authService.logout(refreshToken);

    res.clearCookie(authService.REFRESH_COOKIE, authService.getClearCookieOptions());

    return success(res, null, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    res.clearCookie(authService.REFRESH_COOKIE, authService.getClearCookieOptions());

    return success(res, result, 'Password changed successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, refresh, logout, changePassword };
