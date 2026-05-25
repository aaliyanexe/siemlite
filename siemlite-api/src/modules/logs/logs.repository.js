const { query } = require('../../config/db');

async function insertLog(executor, { incidentId, actorId, actionType, oldValue = null, newValue = null }) {
  const result = await executor.query(
    `INSERT INTO incident_logs (incident_id, actor_id, action_type, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING log_id, incident_id, actor_id, action_type, old_value, new_value, log_time`,
    [incidentId, actorId, actionType, oldValue, newValue]
  );
  return result.rows[0];
}

async function findByIncidentId(incidentId) {
  const result = await query(
    `SELECT l.log_id, l.incident_id, l.actor_id, l.action_type, l.old_value, l.new_value, l.log_time,
            u.name AS actor_name
     FROM incident_logs l
     LEFT JOIN users u ON l.actor_id = u.user_id
     WHERE l.incident_id = $1
     ORDER BY l.log_time ASC`,
    [incidentId]
  );
  return result.rows;
}

async function findAll(filters, limit, offset) {
  const conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (filters.actor_id) {
    conditions.push(`l.actor_id = $${idx++}`);
    params.push(filters.actor_id);
  }
  if (filters.action_type) {
    conditions.push(`l.action_type ILIKE $${idx++}`);
    params.push(`%${filters.action_type}%`);
  }
  // Filter by specific incident — new
  if (filters.incident_id) {
    conditions.push(`l.incident_id = $${idx++}`);
    params.push(filters.incident_id);
  }
  // Filter by incident severity — new
  if (filters.severity) {
    conditions.push(`i.severity = $${idx++}`);
    params.push(filters.severity);
  }
  if (filters.date_from) {
    conditions.push(`l.log_time >= $${idx++}`);
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push(`l.log_time <= $${idx++}`);
    params.push(filters.date_to);
  }

  const where = conditions.join(' AND ');

  const countR = await query(
    `SELECT COUNT(*)::int AS total
     FROM incident_logs l
     JOIN incidents i ON l.incident_id = i.incident_id
     WHERE ${where}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT
       l.log_id,
       l.incident_id,
       l.actor_id,
       l.action_type,
       l.old_value,
       l.new_value,
       l.log_time,
       CASE WHEN u.is_active = FALSE
            THEN u.name || ' [Deactivated]'
            ELSE u.name
       END AS actor_name,
       u.role        AS actor_role,
       i.title       AS incident_title,
       i.severity    AS incident_severity,
       i.status      AS incident_status
     FROM incident_logs l
     LEFT JOIN users    u ON l.actor_id    = u.user_id
     JOIN  incidents    i ON l.incident_id = i.incident_id
     WHERE ${where}
     ORDER BY l.log_time DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return { rows: result.rows, total: countR.rows[0].total };
}

module.exports = { insertLog, findByIncidentId, findAll };
