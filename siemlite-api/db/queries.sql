-- SIEMlite — Key SQL Queries (SRS Section 5.3)
-- Course rubric: 4 required analytics / reporting queries

-- ---------------------------------------------------------------------------
-- 1. Threat frequency (GROUP BY)
-- ---------------------------------------------------------------------------
SELECT t.name AS threat_type, COUNT(i.incident_id) AS total
FROM threat_types t
LEFT JOIN incidents i ON i.threat_type_id = t.threat_type_id
    AND i.is_deleted = FALSE
GROUP BY t.threat_type_id, t.name
ORDER BY total DESC;

-- ---------------------------------------------------------------------------
-- 2. Analysts above average workload (subquery in HAVING)
-- ---------------------------------------------------------------------------
SELECT u.name, COUNT(r.response_id) AS actions
FROM users u
JOIN response_actions r ON r.analyst_id = u.user_id
    AND r.is_deleted = FALSE
GROUP BY u.user_id, u.name
HAVING COUNT(r.response_id) > (
    SELECT AVG(action_count) FROM (
        SELECT COUNT(*) AS action_count
        FROM response_actions
        WHERE is_deleted = FALSE
        GROUP BY analyst_id
    ) sub
)
ORDER BY actions DESC;

-- ---------------------------------------------------------------------------
-- 3. Full incident detail (3-table join)
-- ---------------------------------------------------------------------------
SELECT i.*, u1.name AS reporter, u2.name AS analyst,
       t.name AS threat_type, a.asset_name
FROM incidents i
JOIN users u1 ON i.reported_by = u1.user_id
LEFT JOIN users u2 ON i.assigned_analyst_id = u2.user_id
JOIN threat_types t ON i.threat_type_id = t.threat_type_id
JOIN assets a ON i.asset_id = a.asset_id
WHERE i.incident_id = $1 AND i.is_deleted = FALSE;

-- ---------------------------------------------------------------------------
-- 4. Open OR server asset incidents (UNION)
-- ---------------------------------------------------------------------------
SELECT incident_id, title, status FROM incidents
WHERE status = 'Open' AND is_deleted = FALSE
UNION
SELECT i.incident_id, i.title, i.status FROM incidents i
JOIN assets a ON i.asset_id = a.asset_id
WHERE a.asset_type = 'Server' AND i.is_deleted = FALSE
ORDER BY incident_id;
