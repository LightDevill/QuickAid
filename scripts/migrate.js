// Database Migration Script
// Run: node scripts/migrate.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://quickaid:quickaid_secret@localhost:5432/quickaid'
});

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('[Migrate] Starting database migration...');

        // Create migrations tracking table
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

        // Get applied migrations
        const applied = await client.query('SELECT version FROM schema_migrations ORDER BY version');
        const appliedVersions = new Set(applied.rows.map(r => r.version));

        // Read migration files
        const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        let migrationsRun = 0;

        for (const file of files) {
            const version = file.replace('.sql', '');

            if (appliedVersions.has(version)) {
                console.log(`[Migrate] Skipping ${file} (already applied)`);
                continue;
            }

            console.log(`[Migrate] Applying ${file}...`);

            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            await client.query('BEGIN');

            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (version) VALUES ($1)',
                    [version]
                );
                await client.query('COMMIT');

                console.log(`[Migrate] Applied ${file} successfully`);
                migrationsRun++;
            } catch (err) {
                await client.query('ROLLBACK');
                throw new Error(`Migration ${file} failed: ${err.message}`);
            }
        }

        if (migrationsRun === 0) {
            console.log('[Migrate] No new migrations to apply');
        } else {
            console.log(`[Migrate] Applied ${migrationsRun} migration(s)`);
        }

        console.log('[Migrate] Migration complete');
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    migrate()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('[Migrate] Error:', err.message);
            process.exit(1);
        });
}

module.exports = { migrate };
