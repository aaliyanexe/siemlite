require('dotenv').config();
const { pool, query } = require('../src/config/db');

const tables = [
  'users',
  'threat_types',
  'assets',
  'incidents',
  'response_actions',
  'incident_logs',
  'refresh_tokens',
];

async function main() {
  for (const t of tables) {
    const r = await query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    console.log(`${t}: ${r.rows[0].n} rows`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
