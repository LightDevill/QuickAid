const { Pool } = require('pg');
const config = require('./env');
const logger = require('./logger');

const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.name,
    password: config.db.password,
    port: config.db.port,
    max: 20, // Max clients in the pool
    idleTimeoutMillis: 30000,
});

pool.on('error', (err, client) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.on('connect', () => {
    // logger.info('New client connected to database');
});

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // logger.info('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        logger.error('Database query error', { text, error });
        throw error;
    }
};

const getClient = async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    // Monkey patch the query method to keep track of the last query executed
    const timeout = setTimeout(() => {
        logger.error('A client has been checked out for more than 5 seconds!');
        logger.error(`Last executed query on this client: ${client.lastQuery}`);
    }, 5000);

    client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
    };

    client.release = () => {
        clearTimeout(timeout);
        client.query = query;
        client.release = release;
        return release.apply(client);
    };

    return client;
};

module.exports = {
    pool,
    query,
    getClient,
};
