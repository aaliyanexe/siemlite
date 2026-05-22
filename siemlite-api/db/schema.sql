-- SIEMlite Database Schema
-- PostgreSQL 15+ | DDL submission script
-- Run: psql $DATABASE_URL -f db/schema.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    user_id              SERIAL PRIMARY KEY,
    name                 VARCHAR(50) NOT NULL,
    email                VARCHAR(80) UNIQUE NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    role                 VARCHAR(20) NOT NULL
        CHECK (role IN ('Analyst', 'Admin')),
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    force_pw_change      BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until         TIMESTAMP,
    last_login           TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- threat_types
-- ---------------------------------------------------------------------------
CREATE TABLE threat_types (
    threat_type_id   SERIAL PRIMARY KEY,
    name             VARCHAR(50) NOT NULL UNIQUE,
    description      VARCHAR(300),
    category         VARCHAR(40) NOT NULL
        CHECK (category IN (
            'Network', 'Endpoint', 'Application',
            'Social Engineering', 'Insider'
        )),
    severity_default VARCHAR(20) NOT NULL
        CHECK (severity_default IN ('Critical', 'High', 'Medium', 'Low')),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------
CREATE TABLE assets (
    asset_id         SERIAL PRIMARY KEY,
    asset_name       VARCHAR(60) NOT NULL,
    asset_type       VARCHAR(40) NOT NULL
        CHECK (asset_type IN (
            'Server', 'Endpoint', 'Network',
            'Cloud', 'Application', 'Mobile'
        )),
    ip_address       VARCHAR(45),
    owner_department VARCHAR(60),
    owner_name       VARCHAR(50),
    criticality      VARCHAR(20) NOT NULL
        CHECK (criticality IN ('Critical', 'High', 'Medium', 'Low')),
    location         VARCHAR(100),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- incidents
-- ---------------------------------------------------------------------------
CREATE TABLE incidents (
    incident_id         SERIAL PRIMARY KEY,
    title               VARCHAR(100) NOT NULL,
    description         VARCHAR(1000),
    severity            VARCHAR(20) NOT NULL
        CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    status              VARCHAR(20) NOT NULL DEFAULT 'Open'
        CHECK (status IN ('Open', 'Investigating', 'Resolved', 'Reopened')),
    date_reported       TIMESTAMP NOT NULL DEFAULT NOW(),
    sla_deadline        TIMESTAMP NOT NULL,
    sla_breached        BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at         TIMESTAMP,
    resolution_summary  VARCHAR(500),
    ttr_minutes         INTEGER,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    reported_by         INTEGER NOT NULL REFERENCES users(user_id),
    assigned_analyst_id INTEGER REFERENCES users(user_id),
    threat_type_id      INTEGER NOT NULL REFERENCES threat_types(threat_type_id),
    asset_id            INTEGER NOT NULL REFERENCES assets(asset_id)
);

-- ---------------------------------------------------------------------------
-- response_actions
-- ---------------------------------------------------------------------------
CREATE TABLE response_actions (
    response_id        SERIAL PRIMARY KEY,
    incident_id      INTEGER NOT NULL REFERENCES incidents(incident_id),
    analyst_id       INTEGER NOT NULL REFERENCES users(user_id),
    action_type      VARCHAR(40) NOT NULL
        CHECK (action_type IN (
            'Containment', 'Eradication', 'Recovery',
            'Investigation', 'Escalation'
        )),
    action_description VARCHAR(500) NOT NULL,
    action_date        TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at          TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- incident_logs (immutable audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE incident_logs (
    log_id       SERIAL PRIMARY KEY,
    incident_id  INTEGER NOT NULL REFERENCES incidents(incident_id),
    actor_id     INTEGER REFERENCES users(user_id),
    action_type  VARCHAR(60) NOT NULL,
    old_value    VARCHAR(200),
    new_value    VARCHAR(200),
    log_time     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- refresh_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    token_id    SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes (SRS section 5.2 + foreign keys)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_threat_types_is_active ON threat_types(is_active);

CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_assets_is_active ON assets(is_active);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_analyst ON incidents(assigned_analyst_id);
CREATE INDEX idx_incidents_date ON incidents(date_reported);
CREATE INDEX idx_incidents_sla ON incidents(sla_deadline);
CREATE INDEX idx_incidents_sla_breached ON incidents(sla_breached);
CREATE INDEX idx_incidents_threat_type ON incidents(threat_type_id);
CREATE INDEX idx_incidents_asset ON incidents(asset_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_is_deleted ON incidents(is_deleted);

CREATE INDEX idx_response_actions_incident ON response_actions(incident_id);
CREATE INDEX idx_response_actions_analyst ON response_actions(analyst_id);

CREATE INDEX idx_incident_logs_incident ON incident_logs(incident_id);
CREATE INDEX idx_incident_logs_actor ON incident_logs(actor_id);
CREATE INDEX idx_incident_logs_log_time ON incident_logs(log_time);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ---------------------------------------------------------------------------
-- Immutability: revoke UPDATE/DELETE on incident_logs from application role
-- (Run as superuser; application uses a limited DB user in production.)
-- ---------------------------------------------------------------------------
REVOKE UPDATE, DELETE ON incident_logs FROM PUBLIC;

COMMIT;
