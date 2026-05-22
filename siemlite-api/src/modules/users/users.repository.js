const { query } = require('../../config/db');

const PUBLIC_FIELDS = `
  u.user_id, u.name, u.email, u.role, u.is_active, u.force_pw_change,
  u.last_login, u.created_at
`;

function openIncidentCountSubquery() {
  return `(
    SELECT COUNT(*)::int FROM incidents i
    WHERE i.assigned_analyst_id = u.user_id
      AND i.status IN ('Open', 'Investigating', 'Reopened')
      AND i.is_deleted = FALSE
  ) AS open_incident_count`;
}

async function findAll({ role, status, limit, offset }) {
  const conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (role) {
    conditions.push(`u.role = $${idx++}`);
    params.push(role);
  }
  if (status === 'active') {
    conditions.push('u.is_active = TRUE');
  } else if (status === 'inactive') {
    conditions.push('u.is_active = FALSE');
  }

  const where = conditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM users u WHERE ${where}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT ${PUBLIC_FIELDS}, ${openIncidentCountSubquery()}
     FROM users u
     WHERE ${where}
     ORDER BY u.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return { rows: result.rows, total: countResult.rows[0].total };
}

async function findById(userId) {
  const result = await query(
    `SELECT ${PUBLIC_FIELDS}, ${openIncidentCountSubquery()}
     FROM users u WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function findByEmail(email, excludeUserId = null) {
  const params = [email];
  let sql = 'SELECT user_id FROM users WHERE email = $1';
  if (excludeUserId) {
    sql += ' AND user_id != $2';
    params.push(excludeUserId);
  }
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function countActiveAdmins() {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM users WHERE role = 'Admin' AND is_active = TRUE`
  );
  return result.rows[0].count;
}

async function create({ name, email, passwordHash, role }) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, force_pw_change)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING user_id`,
    [name, email, passwordHash, role]
  );
  return findById(result.rows[0].user_id);
}

async function update(userId, fields) {
  const sets = [];
  const params = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      sets.push(`${key} = $${idx++}`);
      params.push(value);
    }
  }
  if (sets.length === 0) return findById(userId);

  params.push(userId);
  await query(
    `UPDATE users SET ${sets.join(', ')} WHERE user_id = $${idx}`,
    params
  );
  return findById(userId);
}

async function deactivate(userId) {
  await query(`UPDATE users SET is_active = FALSE WHERE user_id = $1`, [userId]);
  return findById(userId);
}

async function resetPassword(userId, passwordHash) {
  await query(
    `UPDATE users SET password_hash = $2, force_pw_change = TRUE WHERE user_id = $1`,
    [userId, passwordHash]
  );
  return findById(userId);
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  countActiveAdmins,
  create,
  update,
  deactivate,
  resetPassword,
};
