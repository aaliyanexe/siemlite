const { query } = require('../../config/db');

async function threatFrequencyFixed(dateFrom, dateTo) {
  const joinConditions = ['i.is_deleted = FALSE'];
  const params = [];
  let idx = 1;
  if (dateFrom) {
    joinConditions.push(`i.date_reported >= $${idx++}`);
    params.push(dateFrom);
  }
  if (dateTo) {
    joinConditions.push(`i.date_reported <= $${idx++}`);
    params.push(dateTo);
  }
  const joinFilter = joinConditions.join(' AND ');

  const result = await query(
    `SELECT t.name AS threat_type, COUNT(i.incident_id)::int AS total
     FROM threat_types t
     LEFT JOIN incidents i ON i.threat_type_id = t.threat_type_id AND ${joinFilter}
     GROUP BY t.threat_type_id, t.name
     ORDER BY total DESC`,
    params
  );
  return result.rows;
}

async function analystWorkload() {
  const performance = await query(
    `SELECT u.user_id, u.name,
            COUNT(DISTINCT i.incident_id)::int AS incidents_handled,
            ROUND(AVG(i.ttr_minutes) FILTER (WHERE i.ttr_minutes IS NOT NULL))::int AS avg_ttr_minutes,
            COUNT(r.response_id)::int AS response_actions
     FROM users u
     LEFT JOIN incidents i ON i.assigned_analyst_id = u.user_id AND i.is_deleted = FALSE
     LEFT JOIN response_actions r ON r.analyst_id = u.user_id AND r.is_deleted = FALSE
     WHERE u.role = 'Analyst' AND u.is_active = TRUE
     GROUP BY u.user_id, u.name
     ORDER BY incidents_handled DESC`
  );

  const aboveAvg = await query(
    `SELECT u.name, COUNT(r.response_id)::int AS actions
     FROM users u
     JOIN response_actions r ON r.analyst_id = u.user_id AND r.is_deleted = FALSE
     WHERE u.role = 'Analyst' AND u.is_active = TRUE
     GROUP BY u.user_id, u.name
     HAVING COUNT(r.response_id) > (
       SELECT AVG(action_count) FROM (
         SELECT COUNT(*)::float AS action_count
         FROM response_actions
         WHERE is_deleted = FALSE
         GROUP BY analyst_id
       ) sub
     )
     ORDER BY actions DESC`
  );

  return { analysts: performance.rows, above_average: aboveAvg.rows };
}

async function assetExposure() {
  const ranked = await query(
    `SELECT a.asset_id, a.asset_name, a.asset_type, a.criticality,
            COUNT(i.incident_id)::int AS incident_count,
            SUM(CASE i.severity
              WHEN 'Critical' THEN 4 WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END)::int AS severity_score
     FROM assets a
     LEFT JOIN incidents i ON i.asset_id = a.asset_id AND i.is_deleted = FALSE
     GROUP BY a.asset_id, a.asset_name, a.asset_type, a.criticality
     ORDER BY severity_score DESC, incident_count DESC`
  );

  const byType = await query(
    `SELECT a.asset_type, COUNT(i.incident_id)::int AS total
     FROM assets a
     LEFT JOIN incidents i ON i.asset_id = a.asset_id AND i.is_deleted = FALSE
     GROUP BY a.asset_type
     ORDER BY total DESC`
  );

  return { ranked: ranked.rows, by_asset_type: byType.rows };
}

async function slaCompliance() {
  const bySeverity = await query(
    `SELECT severity,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'Resolved' AND (resolved_at <= sla_deadline OR sla_breached = FALSE))::int AS within_sla,
            ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Resolved' AND resolved_at <= sla_deadline) /
              NULLIF(COUNT(*) FILTER (WHERE status = 'Resolved'), 0), 1) AS compliance_pct
     FROM incidents
     WHERE is_deleted = FALSE
     GROUP BY severity
     ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END`
  );

  const breached = await query(
    `SELECT incident_id, title, severity, status, sla_deadline, date_reported
     FROM incidents
     WHERE is_deleted = FALSE AND sla_breached = TRUE AND status != 'Resolved'
     ORDER BY sla_deadline ASC`
  );

  return { by_severity: bySeverity.rows, breached_incidents: breached.rows };
}

async function incidentTrends(period = 'daily', dateFrom, dateTo) {
  const trunc = { daily: 'day', weekly: 'week', monthly: 'month' }[period] || 'day';
  const params = [];
  const conditions = ['is_deleted = FALSE'];
  let idx = 1;
  if (dateFrom) {
    conditions.push(`date_reported >= $${idx++}`);
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`date_reported <= $${idx++}`);
    params.push(dateTo);
  }

  const overTime = await query(
    `SELECT DATE_TRUNC('${trunc}', date_reported) AS period,
            COUNT(*)::int AS total
     FROM incidents
     WHERE ${conditions.join(' AND ')}
     GROUP BY period
     ORDER BY period ASC`,
    params
  );

  const statusOverTime = await query(
    `SELECT DATE_TRUNC('${trunc}', date_reported) AS period, status,
            COUNT(*)::int AS total
     FROM incidents
     WHERE ${conditions.join(' AND ')}
     GROUP BY period, status
     ORDER BY period ASC, status`,
    params
  );

  return { over_time: overTime.rows, status_distribution: statusOverTime.rows };
}

async function adminDashboard() {
  const totals = await query(
    `SELECT
       COUNT(*)::int AS total_incidents,
       COUNT(*) FILTER (WHERE status IN ('Open','Investigating','Reopened'))::int AS open_incidents,
       COUNT(*) FILTER (WHERE status IN ('Open','Investigating','Reopened') AND severity IN ('Critical','High'))::int AS critical_high_open,
       COUNT(*) FILTER (WHERE sla_breached = TRUE AND status != 'Resolved')::int AS sla_breached_count
     FROM incidents WHERE is_deleted = FALSE`
  );

  const byStatus = await query(
    `SELECT status, COUNT(*)::int AS total FROM incidents
     WHERE is_deleted = FALSE GROUP BY status`
  );

  const bySeverity = await query(
    `SELECT severity, COUNT(*)::int AS total FROM incidents
     WHERE is_deleted = FALSE GROUP BY severity
     ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END`
  );

  const threatFreq = await threatFrequencyFixed(null, null);
  const topAssets = await query(
    `SELECT a.asset_name, COUNT(i.incident_id)::int AS incident_count
     FROM assets a
     JOIN incidents i ON i.asset_id = a.asset_id AND i.is_deleted = FALSE
     GROUP BY a.asset_id, a.asset_name
     ORDER BY incident_count DESC
     LIMIT 5`
  );

  const workload = await query(
    `SELECT u.name AS analyst_name,
            COUNT(i.incident_id)::int AS open_incidents
     FROM users u
     LEFT JOIN incidents i ON i.assigned_analyst_id = u.user_id
       AND i.status IN ('Open','Investigating','Reopened') AND i.is_deleted = FALSE
     WHERE u.role = 'Analyst' AND u.is_active = TRUE
     GROUP BY u.user_id, u.name
     ORDER BY open_incidents DESC`
  );

  const recentActivity = await query(
    `SELECT l.log_id, l.incident_id, l.action_type, l.old_value, l.new_value, l.log_time,
            u.name AS actor_name, i.title AS incident_title
     FROM incident_logs l
     LEFT JOIN users u ON l.actor_id = u.user_id
     JOIN incidents i ON l.incident_id = i.incident_id
     ORDER BY l.log_time DESC
     LIMIT 10`
  );

  const mttr = await query(
    `SELECT severity,
            ROUND(AVG(ttr_minutes))::int AS avg_ttr_minutes
     FROM incidents
     WHERE is_deleted = FALSE AND ttr_minutes IS NOT NULL
     GROUP BY severity
     ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END`
  );

  return {
    totals: totals.rows[0],
    by_status: byStatus.rows,
    by_severity: bySeverity.rows,
    threat_frequency: threatFreq,
    top_exposed_assets: topAssets.rows,
    analyst_workload: workload.rows,
    recent_activity: recentActivity.rows,
    mttr_by_severity: mttr.rows,
  };
}

async function analystDashboard(userId) {
  const open = await query(
    `SELECT COUNT(*)::int AS count FROM incidents
     WHERE assigned_analyst_id = $1 AND status IN ('Open','Investigating','Reopened') AND is_deleted = FALSE`,
    [userId]
  );

  const slaBreached = await query(
    `SELECT COUNT(*)::int AS count FROM incidents
     WHERE assigned_analyst_id = $1 AND sla_breached = TRUE AND status != 'Resolved' AND is_deleted = FALSE`,
    [userId]
  );

  const resolvedMonth = await query(
    `SELECT COUNT(*)::int AS count FROM incidents
     WHERE assigned_analyst_id = $1 AND status = 'Resolved'
       AND resolved_at >= DATE_TRUNC('month', NOW()) AND is_deleted = FALSE`,
    [userId]
  );

  const bySeverity = await query(
    `SELECT severity, COUNT(*)::int AS total FROM incidents
     WHERE assigned_analyst_id = $1 AND status IN ('Open','Investigating','Reopened') AND is_deleted = FALSE
     GROUP BY severity`,
    [userId]
  );

  const recentActivity = await query(
    `SELECT l.log_id, l.incident_id, l.action_type, l.log_time, i.title AS incident_title
     FROM incident_logs l
     JOIN incidents i ON l.incident_id = i.incident_id
     WHERE i.assigned_analyst_id = $1
     ORDER BY l.log_time DESC
     LIMIT 10`,
    [userId]
  );

  return {
    my_open_incidents: open.rows[0].count,
    my_sla_breached: slaBreached.rows[0].count,
    my_resolved_this_month: resolvedMonth.rows[0].count,
    by_severity: bySeverity.rows,
    recent_activity: recentActivity.rows,
  };
}

module.exports = {
  threatFrequency: threatFrequencyFixed,
  analystWorkload,
  assetExposure,
  slaCompliance,
  incidentTrends,
  adminDashboard,
  analystDashboard,
};
