const { Pool } = require('pg');
const config = require('../../config/env');

const pool = new Pool({
  connectionString: config.databaseUrl,
});

// Ensure status column exists on users table (Default APPROVED)
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';`).catch(() => {});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
