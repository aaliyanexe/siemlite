const { query } = require('../../config/db');

const DISPLAY_NAME = (alias) =>
  `CASE WHEN ${alias}.is_active = FALSE THEN ${alias}.name || ' [Deactivated]' ELSE ${alias}.name END`;

async function findByIncident(incidentId) {
  const result = await query(
    `SELECT r.response_id, r.incident_id, r.analyst_id, r.action_type,
            r.action_description, r.action_date, r.edited_at,
            ${DISPLAY_NAME('u')} AS analyst_name
     FROM response_actions r
     JOIN users u ON r.analyst_id = u.user_id
     WHERE r.incident_id = $1 AND r.is_deleted = FALSE
     ORDER BY r.action_date ASC`,
    [incidentId]
  );
  return result.rows;
}

async function findById(responseId, incidentId) {
  const result = await query(
    `SELECT r.*, ${DISPLAY_NAME('u')} AS analyst_name
     FROM response_actions r
     JOIN users u ON r.analyst_id = u.user_id
     WHERE r.response_id = $1 AND r.incident_id = $2 AND r.is_deleted = FALSE`,
    [responseId, incidentId]
  );
  return result.rows[0] || null;
}

async function create(client, { incidentId, analystId, actionType, actionDescription }) {
  const executor = client || { query };
  const result = await executor.query(
    `INSERT INTO response_actions (incident_id, analyst_id, action_type, action_description)
     VALUES ($1, $2, $3, $4)
     RETURNING response_id, incident_id, analyst_id, action_type, action_description, action_date`,
    [incidentId, analystId, actionType, actionDescription]
  );
  return result.rows[0];
}

async function update(client, responseId, incidentId, fields) {
  const sets = ['edited_at = NOW()'];
  const params = [];
  let idx = 1;

  if (fields.action_type !== undefined) {
    sets.push(`action_type = $${idx++}`);
    params.push(fields.action_type);
  }
  if (fields.action_description !== undefined) {
    sets.push(`action_description = $${idx++}`);
    params.push(fields.action_description);
  }

  params.push(responseId, incidentId);
  const ridIdx = idx++;
  const incIdx = idx;
  const executor = client || { query };
  await executor.query(
    `UPDATE response_actions SET ${sets.join(', ')}
     WHERE response_id = $${ridIdx} AND incident_id = $${incIdx} AND is_deleted = FALSE`,
    params
  );
  return findById(responseId, incidentId);
}

async function softDelete(client, responseId, incidentId) {
  const executor = client || { query };
  await executor.query(
    `UPDATE response_actions SET is_deleted = TRUE, edited_at = NOW()
     WHERE response_id = $1 AND incident_id = $2`,
    [responseId, incidentId]
  );
}

module.exports = {
  findByIncident,
  findById,
  create,
  update,
  softDelete,
};
