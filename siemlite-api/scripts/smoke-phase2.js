require('dotenv').config();

const BASE = `http://localhost:${process.env.PORT || 5000}/api/v1`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@siem.com', password: 'Admin@1234' }),
  });
  if (!login.json.success) throw new Error('Login failed');
  const token = login.json.data.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  const users = await request('/users?limit=5', { headers: auth });
  console.log('GET /users', users.status, users.json.success);

  const incidents = await request('/incidents?limit=3&sla_breached=true', { headers: auth });
  console.log('GET /incidents', incidents.status, incidents.json.success);

  const id = incidents.json.data[0]?.incident_id;
  if (id) {
    const detail = await request(`/incidents/${id}`, { headers: auth });
    console.log('GET /incidents/:id', detail.status, detail.json.success);

    const timeline = await request(`/incidents/${id}/timeline`, { headers: auth });
    console.log('GET /incidents/:id/timeline', timeline.status, timeline.json.success, `entries=${timeline.json.data?.length}`);

    const responses = await request(`/incidents/${id}/responses`, { headers: auth });
    console.log('GET /incidents/:id/responses', responses.status, responses.json.success);
  }

  const me = await request('/users/me', { headers: auth });
  console.log('GET /users/me', me.status, me.json.success);

  console.log('\nPhase 2 smoke tests passed');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
