# SIEMlite API

Security Incident & Event Management REST API (Phase 1: Database + Auth).

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or Neon)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set `DATABASE_URL` and `JWT_SECRET` (32+ characters):

```bash
copy .env.example .env
```

3. Create database and load schema + seed:

```bash
psql "YOUR_DATABASE_URL" -f db/schema.sql
psql "YOUR_DATABASE_URL" -f db/seed.sql
```

4. Start the server:

```bash
npm run dev
```

API base: `http://localhost:5000/api/v1`

## Default users

| Role    | Email              | Password     |
|---------|--------------------|--------------|
| Admin   | admin@siem.com     | Admin@1234   |
| Analyst | analyst@siem.com   | Analyst@1234 |

All other seeded users use password `Analyst@1234`.

## Phase 3 endpoints

### Threat types (FR-04)

| Method | Path | Access |
|--------|------|--------|
| GET | `/threat-types` | Authenticated |
| POST | `/threat-types` | Admin |
| PUT | `/threat-types/:id` | Admin |
| PATCH | `/threat-types/:id/deactivate` | Admin |

### Assets (FR-05)

| Method | Path | Access |
|--------|------|--------|
| GET | `/assets` | Authenticated (filterable) |
| POST | `/assets` | Admin |
| GET | `/assets/:id` | Authenticated |
| PUT | `/assets/:id` | Admin |
| GET | `/assets/:id/incidents` | Authenticated + exposure score |
| PATCH | `/assets/:id/deactivate` | Admin |

### Analytics (FR-09)

| Method | Path |
|--------|------|
| GET | `/analytics/threat-frequency` |
| GET | `/analytics/analyst-workload` |
| GET | `/analytics/asset-exposure` |
| GET | `/analytics/sla-compliance` |
| GET | `/analytics/incident-trends` |
| GET | `/analytics/dashboard/admin` |
| GET | `/analytics/dashboard/analyst` |

### Audit log (FR-07)

| Method | Path | Access |
|--------|------|--------|
| GET | `/logs` | Admin, paginated |

## Phase 2 endpoints

### Users (FR-02) — Admin unless noted

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Paginated list (`role`, `status`, `page`, `limit`) |
| POST | `/users` | Create user |
| GET | `/users/me` | Current user profile |
| GET | `/users/:id` | User by id |
| PUT | `/users/:id` | Update user |
| PATCH | `/users/:id/deactivate` | Soft deactivate |
| PATCH | `/users/:id/reset-password` | Reset password + force change |

### Incidents (FR-03)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/incidents` | List/filter/search (`status`, `severity`, `search`, `sla_breached`, etc.) |
| POST | `/incidents` | Create (auto SLA deadline) |
| GET | `/incidents/:id` | Full detail |
| PUT | `/incidents/:id` | Update (assigned analyst or Admin) |
| PATCH | `/incidents/:id/assign` | Assign / self-assign |
| PATCH | `/incidents/:id/status` | Status transition |
| PATCH | `/incidents/:id/resolve` | Resolve with `resolution_summary` |
| PATCH | `/incidents/:id/reopen` | Admin only |
| DELETE | `/incidents/:id` | Admin soft delete |
| GET | `/incidents/:id/timeline` | Logs + responses merged |
| GET | `/incidents/:id/logs` | Audit log only |

### Response actions (FR-06)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/incidents/:id/responses` | List responses |
| POST | `/incidents/:id/responses` | Log action (assigned analyst / Admin) |
| PUT | `/incidents/:id/responses/:rid` | Edit (1hr window for analyst) |
| DELETE | `/incidents/:id/responses/:rid` | Admin soft delete |

## Auth endpoints (FR-01)

| Method | Path                      | Auth     | Description        |
|--------|---------------------------|----------|--------------------|
| POST   | `/api/v1/auth/login`      | Public   | Login              |
| POST   | `/api/v1/auth/refresh`    | Cookie   | Rotate refresh JWT |
| POST   | `/api/v1/auth/logout`     | Cookie   | Invalidate refresh |
| POST   | `/api/v1/auth/change-password` | Bearer | Change password |

### Login example

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@siem.com\",\"password\":\"Admin@1234\"}" \
  -c cookies.txt
```

### Refresh example

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh -b cookies.txt -c cookies.txt
```

## Database deliverables

- `db/schema.sql` — DDL submission (7 tables + indexes)
- `db/seed.sql` — 30 records per table
- `db/queries.sql` — 4 SRS analytics queries

## Project structure

```
siemlite-api/
├── db/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── modules/auth/
│   └── utils/
├── server.js
└── package.json
```
