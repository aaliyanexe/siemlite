const { query } = require('../../config/db');

async function findAll(activeOnly = false) {
  const clause = activeOnly ? 'WHERE is_active = TRUE' : '';
  const result = await query(
    `SELECT threat_type_id, name, description, category, severity_default, is_active, created_at
     FROM threat_types ${clause}
     ORDER BY name ASC`
  );
  return result.rows;
}

async function findById(id) {
  const result = await query(
    `SELECT threat_type_id, name, description, category, severity_default, is_active, created_at
     FROM threat_types WHERE threat_type_id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function findByName(name, excludeId = null) {
  const params = [name];
  let sql = 'SELECT threat_type_id FROM threat_types WHERE name = $1';
  if (excludeId) {
    sql += ' AND threat_type_id != $2';
    params.push(excludeId);
  }
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO threat_types (name, description, category, severity_default)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.description || null, data.category, data.severity_default]
  );
  return result.rows[0];
}

async function update(id, data) {
  const sets = [];
  const params = [];
  let idx = 1;
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      sets.push(`${k} = $${idx++}`);
      params.push(v);
    }
  }
  if (!sets.length) return findById(id);
  params.push(id);
  const result = await query(
    `UPDATE threat_types SET ${sets.join(', ')} WHERE threat_type_id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deactivate(id) {
  const result = await query(
    `UPDATE threat_types SET is_active = FALSE WHERE threat_type_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

async function getUsageStats() {
  const result = await query(
    `SELECT t.threat_type_id, t.name AS threat_type, COUNT(i.incident_id)::int AS total
     FROM threat_types t
     LEFT JOIN incidents i ON i.threat_type_id = t.threat_type_id AND i.is_deleted = FALSE
     GROUP BY t.threat_type_id, t.name
     ORDER BY total DESC`
  );
  return result.rows;
}

module.exports = {
  findAll,
  findById,
  findByName,
  create,
  update,
  deactivate,
  getUsageStats,
};
