const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration - use Railway's auto-generated variables
const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'root',
    database: process.env.MYSQLDATABASE || 'hardware_shop',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false
};

console.log(`Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Initialize database and create tables
 */
async function initializeDatabase() {
    let connection;
    try {
        console.log('Attempting to connect to database...');
        
        // Try connecting directly to the database
        connection = await pool.getConnection();
        console.log('✓ Connected to database');
        
        // Test connection
        await connection.execute('SELECT 1');
        console.log('✓ Database connection verified');

        // Read and execute schema
        const fs = require('fs');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split statements and execute them idempotently
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        let created = 0;
        let skipped = 0;
        
        for (const raw of statements) {
            const statement = raw.trim();
            if (!statement) continue;

            try {
                await connection.execute(statement);
                if (statement.toUpperCase().includes('CREATE TABLE')) created++;
            } catch (err) {
                const msg = (err && err.message) ? err.message : '';
                const code = err && err.code;

                // Skip duplicate key/index/table errors (idempotent)
                if (
                    code === 'ER_DUP_KEYNAME' ||
                    code === 'ER_TABLE_EXISTS_ERROR' ||
                    msg.includes('Duplicate key name') ||
                    msg.includes('already exists')
                ) {
                    skipped++;
                    continue;
                }
                
                // Log actual error for debugging
                console.error(`Error executing statement: ${statement.substring(0, 50)}...`);
                console.error(`Error code: ${code}, Message: ${msg}`);
                throw err;
            }
        }

        console.log(`✓ Database initialized successfully (${created} tables created, ${skipped} skipped)`);
        return true;
    } catch (error) {
        console.error('✗ Database initialization error:', error.message);
        console.error('Stack:', error.stack);
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
