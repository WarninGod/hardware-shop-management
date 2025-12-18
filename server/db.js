const mysql = require('mysql2/promise');
const path = require('path');

// Debug: Log all MySQL-related env vars
console.log('=== Environment Variables ===');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLPORT:', process.env.MYSQLPORT);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '***SET***' : 'NOT SET');
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('==============================');

// Use Railway's individual MySQL variables
const dbConfig = {
    host: process.env.MYSQLHOST || 'mysql.railway.internal',
    port: parseInt(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false
};

console.log(`📡 Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} as ${dbConfig.user}`);
console.log(`   Password: ${dbConfig.password ? '***SET***' : 'EMPTY'}`);

const pool = mysql.createPool(dbConfig);

/**
 * Initialize database and create tables
 */
async function initializeDatabase() {
    let connection;
    try {
        console.log('Attempting to connect to database...');
        
        connection = await pool.getConnection();
        console.log('✓ Connected to database');
        
        await connection.execute('SELECT 1');
        console.log('✓ Database connection verified');

        const fs = require('fs');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

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

                if (
                    code === 'ER_DUP_KEYNAME' ||
                    code === 'ER_TABLE_EXISTS_ERROR' ||
                    msg.includes('Duplicate key name') ||
                    msg.includes('already exists')
                ) {
                    skipped++;
                    continue;
                }
                
                console.error(`Error executing: ${statement.substring(0, 50)}...`);
                console.error(`Code: ${code}, Message: ${msg}`);
                throw err;
            }
        }

        console.log(`✓ Database initialized (${created} tables created, ${skipped} skipped)`);
        return true;
    } catch (error) {
        console.error('✗ Database initialization error:', error.message);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

function getPool() {
    return pool;
}

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
