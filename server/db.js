const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'hardware_shop',
    port: process.env.DB_PORT || 3306,  // ADD THIS LINE
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Initialize database and create tables
 */
async function initializeDatabase() {
    let connection;
    try {
        // Connect without database first to create it
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        // Create database if it doesn't exist
        await tempConnection.execute(
            `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        
        await tempConnection.end();

        // Now connect to the database
        connection = await pool.getConnection();

        // Read and execute schema
        const fs = require('fs');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split statements and execute them idempotently
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const raw of statements) {
          const statement = raw.trim();
          if (!statement) continue;

          try {
            await connection.execute(statement);
          } catch (err) {
            // Ignore duplicate index creation and “already exists” noise
            const msg = (err && err.message) ? err.message : '';
            const code = err && err.code;

            // ER_DUP_KEYNAME (1061): Duplicate key name '...'
            // ER_CANT_DROP_FIELD_OR_KEY (1091) when trying to drop non-existent keys (future-safe)
            // Skip if index already exists or similar idempotent cases
            if (
              code === 'ER_DUP_KEYNAME' ||
              msg.includes('Duplicate key name') ||
              msg.includes('already exists') // safety for some DDLs
            ) {
              continue;
            }
            throw err;
          }
        }

        console.log('✓ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('✗ Database initialization error:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get database pool for queries
 */
function getPool() {
    return pool;
}

/**
 * Execute query with connection from pool
 */
async function query(sql, values = []) {
    try {
        const connection = await pool.getConnection();
        try {
            const [results] = await connection.execute(sql, values);
            return results;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

/**
 * Execute query and return single row
 */
async function queryOne(sql, values = []) {
    const results = await query(sql, values);
    return results[0] || null;
}

module.exports = {
    pool,
    getPool,
    query,
    queryOne,
    initializeDatabase
};
