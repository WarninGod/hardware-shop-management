// Test Supabase connection
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

console.log('Testing connection to Supabase...');
console.log('Connection string:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Connection successful!');
    console.log('Server time:', res.rows[0].now);
    pool.end();
});
