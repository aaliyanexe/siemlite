require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function run(file) {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', file), 'utf8');
  console.log(`Running ${file}...`);
  await pool.query(sql);
  console.log(`Done: ${file}`);
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/run-sql.js <schema.sql|seed.sql>');
    process.exit(1);
  }
  try {
    await run(file);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
