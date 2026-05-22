# SIEMlite UI

React 18 + Vite + Tailwind CSS + Recharts

## Setup

```bash
npm install
copy .env.example .env
```

Ensure API is running at `http://localhost:5000` and `CORS_ORIGIN=http://localhost:5173` in `siemlite-api/.env`.

## Run

```bash
npm run dev
```

Open http://localhost:5173 — login with `admin@siem.com` / `Admin@1234`

## Pages

- `/login` — Authentication
- `/dashboard` — Admin or Analyst dashboard (charts)
- `/incidents` — Incident table with search
- `/incidents/:id` — Detail + timeline tabs
- `/assets`, `/threat-types`, `/analytics`
- `/users`, `/audit-log` — Admin only (placeholder UI; API ready)
