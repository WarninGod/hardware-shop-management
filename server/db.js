const { Pool } = require('pg');
const path = require('path');

// Debug: Log all database-related env vars
console.log('=== Environment Variables ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '***SET***' : 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('==============================');

// Use connection string if available, otherwise use individual vars
let pool;
if (process.env.DATABASE_URL) {
    console.log('📡 Connecting using DATABASE_URL connection string');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000
    });
} else {
    // Use Supabase PostgreSQL configuration
    const dbConfig = {
        host: process.env.DB_HOST || 'db.zktdcywawqgslfcfenjq.supabase.co',
        port: parseInt(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'postgres',
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000
    };

    console.log(`📡 Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} as ${dbConfig.user}`);
    console.log(`   Password: ${dbConfig.password ? '***SET***' : 'EMPTY'}`);

    pool = new Pool(dbConfig);
}

/**
 * Initialize database and create tables
 */
async function initializeDatabase() {
    let client;
    try {
        console.log('Attempting to connect to database...');
        
        client = await pool.connect();
        console.log('✓ Connected to database');
        
        await client.query('SELECT 1');
        console.log('✓ Database connection verified');

        const fs = require('fs');
        const schemaPath = path.join(__dirname, 'schema-postgres.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        let created = 0;
        let skipped = 0;
        
        for (const raw of statements) {
            const statement = raw.trim();
            if (!statement) continue;

            try {
                await client.query(statement);
                if (statement.toUpperCase().includes('CREATE TABLE')) created++;
            } catch (err) {
                const msg = (err && err.message) ? err.message : '';
                const code = err && err.code;

                if (
                    code === '42P07' || // PostgreSQL: table already exists
                    code === '42710' || // PostgreSQL: duplicate object
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
        if (client) client.release();
    }
}

function getPool() {
    return pool;
}

async function query(sql, values = []) {
    try {
        const result = await pool.query(sql, values);
        return result.rows;
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
