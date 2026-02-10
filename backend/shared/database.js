// Database connection pool using pg
const { Pool } = require('pg');

// Environment configuration
const config = {
    connectionString: process.env.DATABASE_URL || 'postgres://quickaid:quickaid_secret@localhost:5432/quickaid',
    max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

// Create connection pool
const pool = new Pool(config);

// Log pool events in development
if (process.env.NODE_ENV !== 'production') {
    pool.on('connect', () => {
        console.log('[DB] Client connected to PostgreSQL');
    });

    pool.on('error', (err) => {
        console.error('[DB] Unexpected pool error:', err.message);
    });
}

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {any[]} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV !== 'production' && process.env.LOG_QUERIES === 'true') {
            console.log('[DB] Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount });
        }
        return result;
    } catch (err) {
        console.error('[DB] Query error:', { text: text.substring(0, 100), error: err.message });
        throw err;
    }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
    const client = await pool.connect();
    const release = client.release.bind(client);

    // Override release to log
    client.release = () => {
        client.release = release;
        return release();
    };

    return client;
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Async function receiving client
 * @returns {Promise<any>}
 */
async function transaction(callback) {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Check database connectivity
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
    try {
        await query('SELECT 1');
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Close all pool connections
 * @returns {Promise<void>}
 */
async function close() {
    await pool.end();
    console.log('[DB] Pool closed');
}

module.exports = {
    query,
    getClient,
    transaction,
    healthCheck,
    close,
    pool
};
