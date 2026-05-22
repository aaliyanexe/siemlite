const { query } = require('../../config/db');

async function findAll(filters, limit, offset) {
  const conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (filters.active_only === 'true') conditions.push('a.is_active = TRUE');
  if (filters.asset_type) {
    conditions.push(`a.asset_type = $${idx++}`);
    params.push(filters.asset_type);
  }
  if (filters.department) {
    conditions.push(`a.owner_department ILIKE $${idx++}`);
    params.push(`%${filters.department}%`);
  }
  if (filters.criticality) {
    conditions.push(`a.criticality = $${idx++}`);
    params.push(filters.criticality);
  }

  const where = conditions.join(' AND ');
  const countR = await query(`SELECT COUNT(*)::int AS total FROM assets a WHERE ${where}`, params);
  params.push(limit, offset);
  const result = await query(
    `SELECT a.* FROM assets a WHERE ${where} ORDER BY a.asset_name ASC LIMIT $${idx++} OFFSET $${idx}`,
    params
  );
  return { rows: result.rows, total: countR.rows[0].total };
}

async function findById(id) {
  const result = await query(`SELECT * FROM assets WHERE asset_id = $1`, [id]);
  return result.rows[0] || null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO assets (asset_name, asset_type, ip_address, owner_department, owner_name, criticality, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      data.asset_name,
      data.asset_type,
      data.ip_address || null,
      data.owner_department || null,
      data.owner_name || null,
      data.criticality,
      data.location || null,
    ]
  );
  return result.rows[0];
}

async function update(id, data) {
  const sets = [];
  const params = [];
  let idx = 1;
  const fields = [
    'asset_name',
    'asset_type',
    'ip_address',
    'owner_department',
    'owner_name',
    'criticality',
    'location',
  ];
  for (const f of fields) {
    if (data[f] !== undefined) {
      sets.push(`${f} = $${idx++}`);
      params.push(data[f]);
    }
  }
  if (!sets.length) return findById(id);
  params.push(id);
  const result = await query(
    `UPDATE assets SET ${sets.join(', ')} WHERE asset_id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0];
}

async function deactivate(id) {
  const result = await query(
    `UPDATE assets SET is_active = FALSE WHERE asset_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

async function getIncidentHistory(assetId) {
  const incidents = await query(
    `SELECT incident_id, title, severity, status, date_reported, sla_breached
     FROM incidents WHERE asset_id = $1 AND is_deleted = FALSE
     ORDER BY date_reported DESC`,
    [assetId]
  );
  const exposure = await query(
    `SELECT severity, COUNT(*)::int AS count
     FROM incidents WHERE asset_id = $1 AND is_deleted = FALSE
     GROUP BY severity`,
    [assetId]
  );
  return { incidents: incidents.rows, exposure_by_severity: exposure.rows };
}

module.exports = { findAll, findById, create, update, deactivate, getIncidentHistory };
