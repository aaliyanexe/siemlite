const { query } = require('../../config/db');

const DISPLAY_NAME = (alias) =>
  `CASE WHEN ${alias}.is_active = FALSE THEN ${alias}.name || ' [Deactivated]' ELSE ${alias}.name END`;

async function refreshSlaBreachedFlags() {
  await query(
    `UPDATE incidents
     SET sla_breached = (NOW() > sla_deadline AND status != 'Resolved')
     WHERE is_deleted = FALSE`
  );
}

async function findAll(filters, limit, offset, sort, order) {
  const conditions = ['i.is_deleted = FALSE'];
  const params = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`i.status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.severity) {
    conditions.push(`i.severity = $${idx++}`);
    params.push(filters.severity);
  }
  if (filters.threat_type_id) {
    conditions.push(`i.threat_type_id = $${idx++}`);
    params.push(filters.threat_type_id);
  }
  if (filters.asset_id) {
    conditions.push(`i.asset_id = $${idx++}`);
    params.push(filters.asset_id);
  }
  if (filters.assigned_analyst_id) {
    conditions.push(`i.assigned_analyst_id = $${idx++}`);
    params.push(filters.assigned_analyst_id);
  }
  if (filters.date_from) {
    conditions.push(`i.date_reported >= $${idx++}`);
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push(`i.date_reported <= $${idx++}`);
    params.push(filters.date_to);
  }
  if (filters.sla_breached === 'true') {
    conditions.push('i.sla_breached = TRUE');
  } else if (filters.sla_breached === 'false') {
    conditions.push('i.sla_breached = FALSE');
  }
  if (filters.search) {
    conditions.push(`(i.title ILIKE $${idx} OR i.description ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const sortCol = {
    date_reported: 'i.date_reported',
    severity: 'i.severity',
    status: 'i.status',
    sla_deadline: 'i.sla_deadline',
  }[sort] || 'i.date_reported';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM incidents i WHERE ${where}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT i.incident_id, i.title, i.severity, i.status, i.date_reported,
            i.sla_deadline, i.sla_breached, i.assigned_analyst_id,
            ${DISPLAY_NAME('u2')} AS analyst_name,
            t.name AS threat_type, a.asset_name
     FROM incidents i
     JOIN threat_types t ON i.threat_type_id = t.threat_type_id
     JOIN assets a ON i.asset_id = a.asset_id
     LEFT JOIN users u2 ON i.assigned_analyst_id = u2.user_id
     WHERE ${where}
     ORDER BY ${sortCol} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return { rows: result.rows, total: countResult.rows[0].total };
}

async function findById(incidentId, includeDeleted = false) {
  const deletedClause = includeDeleted ? '' : 'AND i.is_deleted = FALSE';
  const result = await query(
    `SELECT i.*,
            ${DISPLAY_NAME('u1')} AS reporter_name,
            ${DISPLAY_NAME('u2')} AS analyst_name,
            t.name AS threat_type, t.category AS threat_category,
            a.asset_name, a.asset_type, a.criticality AS asset_criticality
     FROM incidents i
     JOIN users u1 ON i.reported_by = u1.user_id
     LEFT JOIN users u2 ON i.assigned_analyst_id = u2.user_id
     JOIN threat_types t ON i.threat_type_id = t.threat_type_id
     JOIN assets a ON i.asset_id = a.asset_id
     WHERE i.incident_id = $1 ${deletedClause}`,
    [incidentId]
  );
  return result.rows[0] || null;
}

async function isThreatTypeActive(threatTypeId) {
  const r = await query(
    `SELECT threat_type_id FROM threat_types WHERE threat_type_id = $1 AND is_active = TRUE`,
    [threatTypeId]
  );
  return r.rows.length > 0;
}

async function isAssetActive(assetId) {
  const r = await query(
    `SELECT asset_id FROM assets WHERE asset_id = $1 AND is_active = TRUE`,
    [assetId]
  );
  return r.rows.length > 0;
}

async function isActiveAnalyst(userId) {
  const r = await query(
    `SELECT user_id FROM users WHERE user_id = $1 AND role = 'Analyst' AND is_active = TRUE`,
    [userId]
  );
  return r.rows.length > 0;
}

async function countResponseActions(incidentId, client = null) {
  const executor = client || { query };
  const r = await executor.query(
    `SELECT COUNT(*)::int AS count FROM response_actions
     WHERE incident_id = $1 AND is_deleted = FALSE`,
    [incidentId]
  );
  return r.rows[0].count;
}

async function create(client, data) {
  const r = await client.query(
    `INSERT INTO incidents (
       title, description, severity, status, sla_deadline, sla_breached,
       reported_by, threat_type_id, asset_id
     ) VALUES ($1, $2, $3, 'Open', $4, FALSE, $5, $6, $7)
     RETURNING incident_id`,
    [
      data.title,
      data.description || null,
      data.severity,
      data.slaDeadline,
      data.reportedBy,
      data.threatTypeId,
      data.assetId,
    ]
  );
  return r.rows[0].incident_id;
}

async function update(client, incidentId, fields) {
  const sets = [];
  const params = [];
  let idx = 1;

  const allowed = [
    'description',
    'severity',
    'threat_type_id',
    'asset_id',
    'assigned_analyst_id',
    'status',
    'sla_deadline',
    'sla_breached',
    'resolved_at',
    'resolution_summary',
    'ttr_minutes',
    'is_deleted',
  ];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx++}`);
      params.push(fields[key]);
    }
  }

  if (sets.length === 0) return;

  params.push(incidentId);
  const executor = client || { query };
  await executor.query(
    `UPDATE incidents SET ${sets.join(', ')} WHERE incident_id = $${idx} AND is_deleted = FALSE`,
    params
  );
}

async function softDelete(incidentId) {
  await query(`UPDATE incidents SET is_deleted = TRUE WHERE incident_id = $1`, [incidentId]);
}

async function getTimeline(incidentId) {
  const result = await query(
    `SELECT * FROM (
       SELECT 'log' AS entry_type, l.log_id AS entry_id, l.log_time AS event_time,
              l.action_type, l.old_value, l.new_value,
              ${DISPLAY_NAME('u')} AS actor_name, l.actor_id,
              NULL::varchar AS response_action_type, NULL::text AS action_description
       FROM incident_logs l
       LEFT JOIN users u ON l.actor_id = u.user_id
       WHERE l.incident_id = $1
       UNION ALL
       SELECT 'response' AS entry_type, r.response_id AS entry_id, r.action_date AS event_time,
              CASE WHEN r.is_deleted THEN 'RESPONSE_DELETED' ELSE 'RESPONSE_ACTION' END AS action_type,
              NULL AS old_value, NULL AS new_value,
              ${DISPLAY_NAME('u')} AS actor_name, r.analyst_id AS actor_id,
              r.action_type AS response_action_type, r.action_description
       FROM response_actions r
       JOIN users u ON r.analyst_id = u.user_id
       WHERE r.incident_id = $1 AND r.is_deleted = FALSE
     ) timeline
     ORDER BY event_time ASC`,
    [incidentId]
  );
  return result.rows;
}

module.exports = {
  refreshSlaBreachedFlags,
  findAll,
  findById,
  isThreatTypeActive,
  isAssetActive,
  isActiveAnalyst,
  countResponseActions,
  create,
  update,
  softDelete,
  getTimeline,
};
