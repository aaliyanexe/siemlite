-- SIEMlite Seed Data
-- 30 records per table | Default credentials in README
-- Run after schema: psql $DATABASE_URL -f db/seed.sql

BEGIN;

-- Password hashes (bcrypt cost 12):
--   Admin@1234   -> $2b$12$zJFgwMxg/IGTT4i0lYKI8ei4qJE5UYXm.FRKYkPPei7k.iW1z7d1.
--   Analyst@1234 -> $2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O

TRUNCATE TABLE
    refresh_tokens,
    incident_logs,
    response_actions,
    incidents,
    assets,
    threat_types,
    users
RESTART IDENTITY CASCADE;

-- ===========================================================================
-- users (30)
-- ===========================================================================
INSERT INTO users (name, email, password_hash, role, is_active, force_pw_change, last_login) VALUES
('System Admin', 'admin@siem.com', '$2b$12$zJFgwMxg/IGTT4i0lYKI8ei4qJE5UYXm.FRKYkPPei7k.iW1z7d1.', 'Admin', TRUE, FALSE, NOW() - INTERVAL '1 hour'),
('Alex Analyst', 'analyst@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '2 hours'),
('Jordan Lee', 'jordan.lee@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '1 day'),
('Sam Rivera', 'sam.rivera@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '3 hours'),
('Casey Morgan', 'casey.morgan@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '5 hours'),
('Riley Chen', 'riley.chen@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '12 hours'),
('Morgan Blake', 'morgan.blake@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '2 days'),
('Taylor Brooks', 'taylor.brooks@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '6 hours'),
('Jamie Fox', 'jamie.fox@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '8 hours'),
('Drew Patel', 'drew.patel@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '4 hours'),
('Avery Kim', 'avery.kim@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '1 day'),
('Quinn Davis', 'quinn.davis@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '10 hours'),
('Blake Nguyen', 'blake.nguyen@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '7 hours'),
('Skyler Reed', 'skyler.reed@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '9 hours'),
('Cameron Holt', 'cameron.holt@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '11 hours'),
('Parker Ellis', 'parker.ellis@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '15 hours'),
('Reese Adams', 'reese.adams@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '18 hours'),
('Hayden Wright', 'hayden.wright@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '20 hours'),
('Emery Scott', 'emery.scott@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '22 hours'),
('Finley Gray', 'finley.gray@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '1 day'),
('Rowan Price', 'rowan.price@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '2 days'),
('Sage Cooper', 'sage.cooper@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '3 days'),
('River Bell', 'river.bell@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '4 days'),
('Phoenix Ward', 'phoenix.ward@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '5 days'),
('Eden Murphy', 'eden.murphy@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '6 days'),
('Kai Sullivan', 'kai.sullivan@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '7 days'),
('Nova Bennett', 'nova.bennett@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '8 days'),
('Atlas Hayes', 'atlas.hayes@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', TRUE, FALSE, NOW() - INTERVAL '9 days'),
('Luna Foster', 'luna.foster@siem.com', '$2b$12$h9OqwWx5GeX5qGs4zchiWeuuuJJjPQzqNtEFH5JCE5aPunayE0i2O', 'Analyst', FALSE, FALSE, NOW() - INTERVAL '30 days'),
('Backup Admin', 'backup.admin@siem.com', '$2b$12$zJFgwMxg/IGTT4i0lYKI8ei4qJE5UYXm.FRKYkPPei7k.iW1z7d1.', 'Admin', TRUE, FALSE, NOW() - INTERVAL '2 days');

-- ===========================================================================
-- threat_types (30)
-- ===========================================================================
INSERT INTO threat_types (name, description, category, severity_default) VALUES
('Phishing Email', 'Credential harvesting via malicious email links', 'Social Engineering', 'High'),
('Ransomware', 'Encryption of endpoints demanding payment', 'Endpoint', 'Critical'),
('SQL Injection', 'Database compromise via unsanitized input', 'Application', 'High'),
('DDoS Attack', 'Distributed denial of service against public services', 'Network', 'High'),
('Brute Force Login', 'Repeated authentication attempts against VPN', 'Network', 'Medium'),
('Malware Dropper', 'Initial payload delivery via USB or download', 'Endpoint', 'High'),
('Insider Data Exfil', 'Unauthorized export of sensitive files', 'Insider', 'Critical'),
('XSS Stored', 'Persistent script injection in web application', 'Application', 'Medium'),
('Port Scan', 'Reconnaissance activity on perimeter hosts', 'Network', 'Low'),
('Privilege Escalation', 'Local exploit to obtain admin rights', 'Endpoint', 'Critical'),
('Business Email Compromise', 'CEO fraud wire transfer request', 'Social Engineering', 'Critical'),
('Cryptominer', 'Unauthorized mining software on servers', 'Endpoint', 'Medium'),
('DNS Tunneling', 'Covert C2 channel over DNS queries', 'Network', 'High'),
('API Key Leak', 'Exposed credentials in public repository', 'Application', 'High'),
('Shadow IT Cloud', 'Unapproved SaaS with corporate data', 'Application', 'Medium'),
('Mobile MDM Bypass', 'Compromised mobile device outside policy', 'Endpoint', 'Medium'),
('Supply Chain Trojan', 'Compromised third-party library update', 'Application', 'Critical'),
('Lateral Movement', 'SMB traversal between internal subnets', 'Network', 'High'),
('Credential Stuffing', 'Automated login using breached passwords', 'Application', 'Medium'),
('Zero-Day Exploit', 'Unpatched vulnerability actively exploited', 'Endpoint', 'Critical'),
('Misconfigured S3', 'Public read bucket with customer PII', 'Application', 'Critical'),
('Spear Phishing', 'Targeted attack against finance department', 'Social Engineering', 'High'),
('Rootkit', 'Persistent kernel-level malware', 'Endpoint', 'Critical'),
('Man-in-the-Middle', 'ARP spoofing on corporate Wi-Fi', 'Network', 'High'),
('Session Hijack', 'Stolen session cookie reuse', 'Application', 'High'),
('Terminated Employee Access', 'Active AD account after offboarding', 'Insider', 'High'),
('WAF Bypass', 'Encoded payloads evading web firewall', 'Application', 'Medium'),
('IoT Botnet', 'Compromised smart devices participating in botnet', 'Network', 'Medium'),
('Typosquatting Domain', 'Lookalike domain for credential theft', 'Social Engineering', 'Medium'),
('Log Tampering', 'Deletion of security event logs', 'Insider', 'High');

-- ===========================================================================
-- assets (30)
-- ===========================================================================
INSERT INTO assets (asset_name, asset_type, ip_address, owner_department, owner_name, criticality, location) VALUES
('DC-PRIMARY-01', 'Server', '10.0.1.10', 'Infrastructure', 'IT Ops', 'Critical', 'Data Center A'),
('WEB-APP-PROD-01', 'Server', '10.0.2.20', 'Engineering', 'Platform Team', 'Critical', 'AWS us-east-1'),
('VPN-GW-01', 'Network', '203.0.113.50', 'Infrastructure', 'Network Team', 'High', 'Perimeter'),
('FIN-DB-01', 'Server', '10.0.3.30', 'Finance', 'DBA Team', 'Critical', 'Data Center A'),
('HR-PORTAL-01', 'Application', '10.0.4.40', 'Human Resources', 'HR IT', 'High', 'Azure East US'),
('CEO-LAPTOP-01', 'Endpoint', '10.0.5.101', 'Executive', 'Executive Office', 'Critical', 'HQ Floor 10'),
('SOC-WORKSTATION-01', 'Endpoint', '10.0.6.201', 'Security', 'SOC Lead', 'High', 'SOC Floor'),
('MAIL-EXCHANGE-01', 'Server', '10.0.1.11', 'Infrastructure', 'Messaging Team', 'Critical', 'Data Center A'),
('DEV-K8S-CLUSTER', 'Cloud', '10.0.7.70', 'Engineering', 'DevOps', 'Medium', 'GCP us-central1'),
('LEGACY-APP-01', 'Application', '10.0.8.80', 'Operations', 'App Support', 'Medium', 'On-Prem Rack 4'),
('WIFI-CONTROLLER-01', 'Network', '10.0.9.90', 'Infrastructure', 'Network Team', 'High', 'HQ Building'),
('BACKUP-NAS-01', 'Server', '10.0.1.12', 'Infrastructure', 'Backup Admin', 'High', 'Data Center B'),
('CRM-SALESFORCE', 'Cloud', NULL, 'Sales', 'RevOps', 'High', 'SaaS'),
('PAYROLL-SYSTEM', 'Application', '10.0.10.100', 'Finance', 'Payroll Admin', 'Critical', 'Data Center A'),
('BUILD-SERVER-CI', 'Server', '10.0.11.110', 'Engineering', 'CI/CD Team', 'Medium', 'AWS us-west-2'),
('ANALYST-LAPTOP-12', 'Endpoint', '10.0.6.212', 'Security', 'Alex Analyst', 'Medium', 'SOC Floor'),
('DMZ-WEB-PROXY', 'Network', '198.51.100.10', 'Infrastructure', 'Network Team', 'High', 'DMZ'),
('MOBILE-MDM-PORTAL', 'Application', '10.0.12.120', 'IT', 'Mobile Team', 'Medium', 'Azure'),
('IOT-SENSOR-GW', 'Network', '10.0.13.130', 'Facilities', 'Facilities IT', 'Low', 'Warehouse'),
('TEST-ENV-DB', 'Server', '10.0.14.140', 'Engineering', 'QA Team', 'Low', 'Lab VLAN'),
('SIEM-AGGREGATOR', 'Server', '10.0.6.50', 'Security', 'SOC Lead', 'Critical', 'SOC Floor'),
('FILE-SHARE-FS01', 'Server', '10.0.15.150', 'Operations', 'Storage Admin', 'High', 'Data Center A'),
('REMOTE-DESKTOP-GW', 'Network', '203.0.113.51', 'Infrastructure', 'IT Ops', 'High', 'Perimeter'),
('MARKETING-WEB-CMS', 'Application', '10.0.16.160', 'Marketing', 'Web Team', 'Medium', 'Cloudflare'),
('TABLET-INVENTORY-05', 'Mobile', '10.0.17.170', 'Operations', 'Warehouse Mgr', 'Low', 'Warehouse'),
('API-GATEWAY-PROD', 'Cloud', '10.0.18.180', 'Engineering', 'API Team', 'High', 'AWS us-east-1'),
('COMPLIANCE-ARCHIVE', 'Server', '10.0.19.190', 'Legal', 'Compliance Officer', 'High', 'Data Center B'),
('NAC-CONTROLLER', 'Network', '10.0.20.200', 'Infrastructure', 'Network Team', 'Medium', 'HQ Building'),
('HELPDESK-KIOSK-03', 'Endpoint', '10.0.21.210', 'IT', 'Service Desk', 'Low', 'HQ Lobby'),
('STAGING-APP-02', 'Application', '10.0.22.220', 'Engineering', 'QA Team', 'Low', 'Lab VLAN');

-- Fix Cloud asset_type - schema allows Cloud not in one row - 'CRM-SALESFORCE' uses Cloud which is valid

-- ===========================================================================
-- incidents (30)
-- ===========================================================================
INSERT INTO incidents (
    title, description, severity, status, date_reported, sla_deadline,
    sla_breached, resolved_at, resolution_summary, ttr_minutes,
    reported_by, assigned_analyst_id, threat_type_id, asset_id
) VALUES
('Suspicious login from foreign IP', 'Multiple failed logins followed by success from Romania', 'High', 'Investigating', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '2 hours', FALSE, NULL, NULL, NULL, 2, 2, 3, 3),
('Ransomware detected on endpoint', 'Encryption process observed on SOC workstation', 'Critical', 'Open', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', FALSE, NULL, NULL, NULL, 1, NULL, 2, 7),
('SQLi attempt on customer portal', 'WAF logged union-based injection attempts', 'High', 'Investigating', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 hour', TRUE, NULL, NULL, NULL, 3, 4, 3, 2),
('DDoS against corporate website', 'Traffic spike 40x baseline on port 443', 'High', 'Resolved', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 20 hours', FALSE, NOW() - INTERVAL '2 days 18 hours', 'Enabled CDN rate limiting and blocked offending ASNs', 1560, 4, 5, 4, 2),
('Brute force on VPN gateway', '5000 auth attempts in 10 minutes', 'Medium', 'Investigating', NOW() - INTERVAL '8 hours', NOW() + INTERVAL '16 hours', FALSE, NULL, NULL, NULL, 5, 6, 5, 3),
('USB malware insertion', 'Autorun blocked on finance laptop', 'High', 'Open', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '3 hours', FALSE, NULL, NULL, NULL, 6, NULL, 6, 6),
('Insider file download spike', 'HR user downloaded 50GB after hours', 'Critical', 'Investigating', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', TRUE, NULL, NULL, NULL, 7, 8, 7, 4),
('Stored XSS in ticket system', 'Payload persisted in comment field', 'Medium', 'Resolved', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', FALSE, NOW() - INTERVAL '20 hours', 'Patched input sanitization and cleared malicious records', 240, 8, 9, 8, 5),
('Port scan from external host', 'Sequential scan of /24 subnet', 'Low', 'Open', NOW() - INTERVAL '12 hours', NOW() + INTERVAL '60 hours', FALSE, NULL, NULL, NULL, 9, NULL, 9, 17),
('Local privilege escalation', 'Exploit kit run on legacy server', 'Critical', 'Investigating', NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '30 minutes', TRUE, NULL, NULL, NULL, 10, 11, 10, 10),
('CEO wire transfer request email', 'Urgent payment instruction from spoofed domain', 'Critical', 'Resolved', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours', FALSE, NOW() - INTERVAL '1 day 22 hours', 'Blocked sender domain and alerted finance', 1320, 11, 12, 11, 6),
('Cryptominer on build server', 'High CPU from unknown process', 'Medium', 'Investigating', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '18 hours', FALSE, NULL, NULL, NULL, 12, 13, 12, 15),
('DNS tunneling outbound', 'Long TXT queries to suspicious domain', 'High', 'Open', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '1 hour', FALSE, NULL, NULL, NULL, 13, NULL, 13, 8),
('GitHub token exposed', 'Scanner found live API key in public repo', 'High', 'Resolved', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 20 hours', FALSE, NOW() - INTERVAL '3 days 19 hours', 'Revoked token and rotated secrets', 3000, 14, 14, 14, 15),
('Unauthorized SaaS signup', 'Dropbox business account with corp email', 'Medium', 'Open', NOW() - INTERVAL '10 hours', NOW() + INTERVAL '14 hours', FALSE, NULL, NULL, NULL, 15, NULL, 15, 13),
('Jailbroken mobile device', 'MDM compliance failure on sales tablet', 'Medium', 'Investigating', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', TRUE, NULL, NULL, NULL, 16, 17, 16, 25),
('Compromised npm dependency', 'Typosquat package in production build', 'Critical', 'Investigating', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '58 minutes', FALSE, NULL, NULL, NULL, 17, 18, 17, 15),
('Lateral SMB movement', 'PsExec activity between VLANs', 'High', 'Open', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '3 hours 15 minutes', FALSE, NULL, NULL, NULL, 18, NULL, 18, 1),
('Credential stuffing attack', '10k login attempts against SSO', 'Medium', 'Resolved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', FALSE, NOW() - INTERVAL '4 days 2 hours', 'Enabled CAPTCHA and IP throttling', 4440, 19, 19, 19, 5),
('Zero-day exploit attempt', 'EDR alert on unpatched workstation', 'Critical', 'Investigating', NOW() - INTERVAL '20 minutes', NOW() + INTERVAL '40 minutes', FALSE, NULL, NULL, NULL, 20, 21, 20, 16),
('Public S3 bucket discovered', 'Security scan found open customer data bucket', 'Critical', 'Resolved', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 23 hours', FALSE, NOW() - INTERVAL '5 days 22 hours', 'Bucket ACL fixed and audit initiated', 8760, 1, 2, 21, 9),
('Spear phish to payroll', 'Malicious attachment in payroll inbox', 'High', 'Open', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '2 hours', FALSE, NULL, NULL, NULL, 22, NULL, 22, 14),
('Rootkit persistence found', 'Boot sector modification on backup server', 'Critical', 'Investigating', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '15 minutes', FALSE, NULL, NULL, NULL, 23, 24, 23, 12),
('ARP spoofing on guest WiFi', 'MITM detected on conference network', 'High', 'Resolved', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 20 hours', FALSE, NOW() - INTERVAL '2 days 19 hours', 'Isolated rogue AP and updated NAC rules', 1500, 24, 25, 24, 11),
('Hijacked admin session', 'Session token reuse from new geography', 'High', 'Investigating', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '3 hours', TRUE, NULL, NULL, NULL, 25, 26, 25, 5),
('Former employee VPN login', 'Active session 30 days post termination', 'High', 'Open', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '20 hours', FALSE, NULL, NULL, NULL, 26, NULL, 26, 3),
('WAF bypass attempt', 'Encoded SQL in query string evaded rules', 'Medium', 'Investigating', NOW() - INTERVAL '9 hours', NOW() + INTERVAL '15 hours', FALSE, NULL, NULL, NULL, 27, 28, 27, 2),
('IoT device C2 traffic', 'Smart sensor beaconing to unknown IP', 'Medium', 'Open', NOW() - INTERVAL '14 hours', NOW() + INTERVAL '58 hours', FALSE, NULL, NULL, NULL, 28, NULL, 28, 19),
('Fake login portal domain', 'Typosquat domain registered yesterday', 'Medium', 'Resolved', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', FALSE, NOW() - INTERVAL '1 day 2 hours', 'Takedown request filed with registrar', 1380, 29, 29, 29, 2),
('Security log deletion', 'Windows event log cleared on domain controller', 'High', 'Reopened', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 20 hours', TRUE, NOW() - INTERVAL '6 days', 'Re-imaged DC and restored logs; reopened after recurrence', 10080, 30, 2, 30, 1);

-- ===========================================================================
-- response_actions (30)
-- ===========================================================================
INSERT INTO response_actions (incident_id, analyst_id, action_type, action_description, action_date) VALUES
(1, 2, 'Investigation', 'Collected VPN auth logs and geolocation data', NOW() - INTERVAL '1 hour'),
(1, 2, 'Containment', 'Forced password reset for affected account', NOW() - INTERVAL '45 minutes'),
(3, 4, 'Investigation', 'Reviewed WAF logs and identified source IPs', NOW() - INTERVAL '4 hours'),
(3, 4, 'Containment', 'Blocked attacking IP ranges at firewall', NOW() - INTERVAL '3 hours'),
(4, 5, 'Containment', 'Enabled CDN DDoS protection profile', NOW() - INTERVAL '3 days'),
(4, 5, 'Recovery', 'Verified service availability post-mitigation', NOW() - INTERVAL '2 days 20 hours'),
(5, 6, 'Investigation', 'Correlated failed auth events with threat intel', NOW() - INTERVAL '6 hours'),
(7, 8, 'Investigation', 'Interviewed HR user and reviewed DLP alerts', NOW() - INTERVAL '3 hours'),
(8, 9, 'Eradication', 'Removed malicious script from database', NOW() - INTERVAL '22 hours'),
(8, 9, 'Recovery', 'Validated ticket system functionality', NOW() - INTERVAL '20 hours'),
(10, 11, 'Containment', 'Isolated legacy server from network', NOW() - INTERVAL '1 hour'),
(11, 12, 'Investigation', 'Traced email headers and attachment hash', NOW() - INTERVAL '2 days'),
(12, 13, 'Eradication', 'Killed miner process and removed persistence', NOW() - INTERVAL '4 hours'),
(14, 14, 'Containment', 'Revoked exposed API credentials', NOW() - INTERVAL '4 days'),
(14, 14, 'Recovery', 'Deployed new secrets via vault rotation', NOW() - INTERVAL '3 days 19 hours'),
(16, 17, 'Containment', 'Wiped and re-enrolled mobile device', NOW() - INTERVAL '20 hours'),
(17, 18, 'Investigation', 'Audited dependency tree for malicious package', NOW() - INTERVAL '1 hour'),
(19, 19, 'Containment', 'Deployed CAPTCHA on SSO login page', NOW() - INTERVAL '5 days'),
(20, 21, 'Containment', 'Isolated endpoint via EDR network containment', NOW() - INTERVAL '15 minutes'),
(21, 2, 'Eradication', 'Closed public ACL on S3 bucket', NOW() - INTERVAL '5 days 23 hours'),
(23, 24, 'Investigation', 'Captured memory image from backup server', NOW() - INTERVAL '30 minutes'),
(24, 25, 'Containment', 'Disabled compromised WiFi VLAN', NOW() - INTERVAL '3 days'),
(25, 26, 'Investigation', 'Invalidated active sessions for admin user', NOW() - INTERVAL '5 hours'),
(27, 28, 'Escalation', 'Engaged application team for WAF rule update', NOW() - INTERVAL '7 hours'),
(29, 29, 'Investigation', 'Submitted domain takedown to registrar', NOW() - INTERVAL '2 days'),
(30, 2, 'Investigation', 'Forensic imaging of domain controller', NOW() - INTERVAL '6 days'),
(30, 2, 'Eradication', 'Rebuilt DC from known-good image', NOW() - INTERVAL '6 days 12 hours'),
(2, 2, 'Investigation', 'Initial triage of ransomware alert', NOW() - INTERVAL '20 minutes'),
(6, 6, 'Containment', 'Quarantined USB device and endpoint', NOW() - INTERVAL '30 minutes'),
(13, 13, 'Investigation', 'DNS query analysis for tunneling pattern', NOW() - INTERVAL '2 hours');

-- ===========================================================================
-- incident_logs (30)
-- ===========================================================================
INSERT INTO incident_logs (incident_id, actor_id, action_type, old_value, new_value, log_time) VALUES
(1, 2, 'INCIDENT_CREATED', NULL, 'Suspicious login from foreign IP', NOW() - INTERVAL '2 hours'),
(1, 2, 'STATUS_CHANGED', 'Open', 'Investigating', NOW() - INTERVAL '1 hour 30 minutes'),
(1, 1, 'ANALYST_ASSIGNED', NULL, 'Alex Analyst', NOW() - INTERVAL '1 hour 45 minutes'),
(2, 1, 'INCIDENT_CREATED', NULL, 'Ransomware detected on endpoint', NOW() - INTERVAL '30 minutes'),
(3, 3, 'INCIDENT_CREATED', NULL, 'SQLi attempt on customer portal', NOW() - INTERVAL '5 hours'),
(3, 4, 'STATUS_CHANGED', 'Open', 'Investigating', NOW() - INTERVAL '4 hours 30 minutes'),
(4, 4, 'INCIDENT_CREATED', NULL, 'DDoS against corporate website', NOW() - INTERVAL '3 days'),
(4, 5, 'STATUS_CHANGED', 'Investigating', 'Resolved', NOW() - INTERVAL '2 days 18 hours'),
(5, 5, 'INCIDENT_CREATED', NULL, 'Brute force on VPN gateway', NOW() - INTERVAL '8 hours'),
(6, 6, 'INCIDENT_CREATED', NULL, 'USB malware insertion', NOW() - INTERVAL '1 hour'),
(7, 7, 'INCIDENT_CREATED', NULL, 'Insider file download spike', NOW() - INTERVAL '4 hours'),
(7, 8, 'SEVERITY_CHANGED', 'High', 'Critical', NOW() - INTERVAL '3 hours 30 minutes'),
(8, 8, 'INCIDENT_CREATED', NULL, 'Stored XSS in ticket system', NOW() - INTERVAL '1 day'),
(8, 9, 'STATUS_CHANGED', 'Investigating', 'Resolved', NOW() - INTERVAL '20 hours'),
(9, 9, 'INCIDENT_CREATED', NULL, 'Port scan from external host', NOW() - INTERVAL '12 hours'),
(10, 10, 'INCIDENT_CREATED', NULL, 'Local privilege escalation', NOW() - INTERVAL '90 minutes'),
(11, 11, 'INCIDENT_CREATED', NULL, 'CEO wire transfer request email', NOW() - INTERVAL '2 days'),
(12, 12, 'INCIDENT_CREATED', NULL, 'Cryptominer on build server', NOW() - INTERVAL '6 hours'),
(14, 14, 'INCIDENT_CREATED', NULL, 'GitHub token exposed', NOW() - INTERVAL '4 days'),
(14, 14, 'STATUS_CHANGED', 'Open', 'Resolved', NOW() - INTERVAL '3 days 19 hours'),
(16, 16, 'INCIDENT_CREATED', NULL, 'Jailbroken mobile device', NOW() - INTERVAL '1 day'),
(17, 17, 'INCIDENT_CREATED', NULL, 'Compromised npm dependency', NOW() - INTERVAL '2 hours'),
(19, 19, 'INCIDENT_CREATED', NULL, 'Credential stuffing attack', NOW() - INTERVAL '5 days'),
(21, 1, 'INCIDENT_CREATED', NULL, 'Public S3 bucket discovered', NOW() - INTERVAL '6 days'),
(21, 2, 'STATUS_CHANGED', 'Investigating', 'Resolved', NOW() - INTERVAL '5 days 22 hours'),
(24, 24, 'INCIDENT_CREATED', NULL, 'ARP spoofing on guest WiFi', NOW() - INTERVAL '3 days'),
(25, 25, 'INCIDENT_CREATED', NULL, 'Hijacked admin session', NOW() - INTERVAL '7 hours'),
(30, 30, 'INCIDENT_CREATED', NULL, 'Security log deletion', NOW() - INTERVAL '7 days'),
(30, 2, 'STATUS_CHANGED', 'Investigating', 'Resolved', NOW() - INTERVAL '6 days'),
(30, 1, 'STATUS_CHANGED', 'Resolved', 'Reopened', NOW() - INTERVAL '1 day');

-- ===========================================================================
-- refresh_tokens (30) — seed placeholders (revoked; login creates live tokens)
-- ===========================================================================
INSERT INTO refresh_tokens (user_id, token_hash, expires_at, is_revoked) VALUES
(1, 'seed_revoked_placeholder_01', NOW() + INTERVAL '7 days', TRUE),
(2, 'seed_revoked_placeholder_02', NOW() + INTERVAL '7 days', TRUE),
(3, 'seed_revoked_placeholder_03', NOW() + INTERVAL '7 days', TRUE),
(4, 'seed_revoked_placeholder_04', NOW() + INTERVAL '7 days', TRUE),
(5, 'seed_revoked_placeholder_05', NOW() + INTERVAL '7 days', TRUE),
(6, 'seed_revoked_placeholder_06', NOW() + INTERVAL '7 days', TRUE),
(7, 'seed_revoked_placeholder_07', NOW() + INTERVAL '7 days', TRUE),
(8, 'seed_revoked_placeholder_08', NOW() + INTERVAL '7 days', TRUE),
(9, 'seed_revoked_placeholder_09', NOW() + INTERVAL '7 days', TRUE),
(10, 'seed_revoked_placeholder_10', NOW() + INTERVAL '7 days', TRUE),
(11, 'seed_revoked_placeholder_11', NOW() + INTERVAL '7 days', TRUE),
(12, 'seed_revoked_placeholder_12', NOW() + INTERVAL '7 days', TRUE),
(13, 'seed_revoked_placeholder_13', NOW() + INTERVAL '7 days', TRUE),
(14, 'seed_revoked_placeholder_14', NOW() + INTERVAL '7 days', TRUE),
(15, 'seed_revoked_placeholder_15', NOW() + INTERVAL '7 days', TRUE),
(16, 'seed_revoked_placeholder_16', NOW() + INTERVAL '7 days', TRUE),
(17, 'seed_revoked_placeholder_17', NOW() + INTERVAL '7 days', TRUE),
(18, 'seed_revoked_placeholder_18', NOW() + INTERVAL '7 days', TRUE),
(19, 'seed_revoked_placeholder_19', NOW() + INTERVAL '7 days', TRUE),
(20, 'seed_revoked_placeholder_20', NOW() + INTERVAL '7 days', TRUE),
(21, 'seed_revoked_placeholder_21', NOW() + INTERVAL '7 days', TRUE),
(22, 'seed_revoked_placeholder_22', NOW() + INTERVAL '7 days', TRUE),
(23, 'seed_revoked_placeholder_23', NOW() + INTERVAL '7 days', TRUE),
(24, 'seed_revoked_placeholder_24', NOW() + INTERVAL '7 days', TRUE),
(25, 'seed_revoked_placeholder_25', NOW() + INTERVAL '7 days', TRUE),
(26, 'seed_revoked_placeholder_26', NOW() + INTERVAL '7 days', TRUE),
(27, 'seed_revoked_placeholder_27', NOW() + INTERVAL '7 days', TRUE),
(28, 'seed_revoked_placeholder_28', NOW() + INTERVAL '7 days', TRUE),
(29, 'seed_revoked_placeholder_29', NOW() + INTERVAL '7 days', TRUE),
(30, 'seed_revoked_placeholder_30', NOW() + INTERVAL '7 days', TRUE);

COMMIT;

-- Reset sequences to max ids
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('threat_types_threat_type_id_seq', (SELECT MAX(threat_type_id) FROM threat_types));
SELECT setval('assets_asset_id_seq', (SELECT MAX(asset_id) FROM assets));
SELECT setval('incidents_incident_id_seq', (SELECT MAX(incident_id) FROM incidents));
SELECT setval('response_actions_response_id_seq', (SELECT MAX(response_id) FROM response_actions));
SELECT setval('incident_logs_log_id_seq', (SELECT MAX(log_id) FROM incident_logs));
SELECT setval('refresh_tokens_token_id_seq', (SELECT MAX(token_id) FROM refresh_tokens));
