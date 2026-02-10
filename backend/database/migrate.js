const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' }); // Adjust path if running from root

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'quickaid',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting migration...');
        const schemaPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');

        // Read the file but skip comments ? No, pg query usually handles them.
        // However, uuid-ossp create extension might need superuser, which 'postgres' is.

        // But reading the whole file as one string might be an issue if there are multiple statements?
        // pool.query supports multiple statements if configured (usually true by default).

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await client.query('BEGIN');
        await client.query(schemaSql);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

migrate();
