const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});

async function check() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
    console.log('Users table columns:');
    res.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    await pool.end();
  } catch(e) {
    console.error('Error:', e.message);
    await pool.end();
  }
}
check();
