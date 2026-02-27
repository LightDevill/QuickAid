const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Create pool using DATABASE_URL from .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    let client;

    try {
        console.log('🔄 Starting migration...');

        client = await pool.connect();

        const schemaPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await client.query('BEGIN');
        await client.query(schemaSql);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }

        console.error('❌ Migration failed:', error.message);
        process.exit(1);

    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

migrate();