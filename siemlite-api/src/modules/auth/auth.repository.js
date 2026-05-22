const { query } = require('../../config/db');

const USER_PUBLIC_FIELDS = `
  user_id, name, email, role, is_active, force_pw_change, last_login, created_at
`;

async function findByEmail(email) {
  const result = await query(
    `SELECT user_id, name, email, password_hash, role, is_active,
            force_pw_change, failed_login_attempts, locked_until, last_login, created_at
     FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findById(userId) {
  const result = await query(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function findByIdWithPassword(userId) {
  const result = await query(
    `SELECT user_id, name, email, password_hash, role, is_active, force_pw_change
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function recordFailedLogin(userId, attempts, lockUntil) {
  await query(
    `UPDATE users
     SET failed_login_attempts = $2,
         locked_until = $3
     WHERE user_id = $1`,
    [userId, attempts, lockUntil]
  );
}

async function recordSuccessfulLogin(userId) {
  await query(
    `UPDATE users
     SET failed_login_attempts = 0,
         locked_until = NULL,
         last_login = NOW()
     WHERE user_id = $1`,
    [userId]
  );
}

async function updatePassword(userId, passwordHash, clearForceChange = true) {
  await query(
    `UPDATE users
     SET password_hash = $2,
         force_pw_change = $3,
         failed_login_attempts = 0,
         locked_until = NULL
     WHERE user_id = $1`,
    [userId, passwordHash, !clearForceChange]
  );
}

async function createRefreshToken(userId, tokenHash, expiresAt) {
  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING token_id`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

async function findValidRefreshToken(tokenHash) {
  const result = await query(
    `SELECT rt.token_id, rt.user_id, rt.expires_at, rt.is_revoked,
            u.email, u.role, u.is_active, u.name
     FROM refresh_tokens rt
     JOIN users u ON u.user_id = rt.user_id
     WHERE rt.token_hash = $1
       AND rt.is_revoked = FALSE
       AND rt.expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

async function revokeRefreshToken(tokenId) {
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_id = $1`,
    [tokenId]
  );
}

async function revokeRefreshTokenByHash(tokenHash) {
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1 AND is_revoked = FALSE`,
    [tokenHash]
  );
}

async function revokeAllUserRefreshTokens(userId) {
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE
     WHERE user_id = $1 AND is_revoked = FALSE`,
    [userId]
  );
}

module.exports = {
  findByEmail,
  findById,
  findByIdWithPassword,
  recordFailedLogin,
  recordSuccessfulLogin,
  updatePassword,
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeRefreshTokenByHash,
  revokeAllUserRefreshTokens,
};
