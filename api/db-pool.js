/**
 * Shared PostgreSQL connection pool for Vercel serverless functions
 * Reused across all API endpoints to avoid creating multiple pools
 */

const { Pool } = require('pg');

// Create single pool instance
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Export the shared pool
module.exports = pool;
