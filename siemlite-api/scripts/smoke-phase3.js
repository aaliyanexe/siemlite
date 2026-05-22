require('dotenv').config();
const BASE = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  return { status: r.status, json: await r.json() };
}

async function main() {
  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@siem.com', password: 'Admin@1234' }),
  });
  const h = { Authorization: `Bearer ${login.json.data.accessToken}` };

  for (const [label, path] of [
    ['threat-types', '/threat-types'],
    ['assets', '/assets?limit=3'],
    ['analytics admin', '/analytics/dashboard/admin'],
    ['threat frequency', '/analytics/threat-frequency'],
    ['sla compliance', '/analytics/sla-compliance'],
    ['audit logs', '/logs?limit=5'],
  ]) {
    const r = await req(path, { headers: h });
    console.log(label, r.status, r.json.success);
    if (!r.json.success) throw new Error(JSON.stringify(r.json));
  }
  console.log('\nPhase 3 API smoke tests passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
