const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

/**
 * Get a client scoped to a specific tenant schema.
 * This is the core of our DB-level isolation strategy.
 */
const getTenantClient = async (schemaName) => {
  const client = await pool.connect();
  // Set search_path so all queries hit the tenant's isolated schema
  await client.query(`SET search_path TO ${schemaName}, public`);
  return client;
};

/**
 * Run a query in the public schema (super-admin operations)
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query, getTenantClient };
