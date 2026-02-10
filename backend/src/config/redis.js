const redis = require('redis');
const config = require('./env');
const logger = require('./logger');

const client = redis.createClient({
    url: `redis://${config.redis.host}:${config.redis.port}`
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis Client Connected'));

// Connect immediately
(async () => {
    try {
        await client.connect();
    } catch (err) {
        logger.error('Failed to connect to Redis', err);
    }
})();

module.exports = client;
