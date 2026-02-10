// Redis client for caching and session management
const Redis = require('ioredis');

// Configuration
const config = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true
};

// Create Redis client
const redis = new Redis(config.url, {
    retryStrategy: config.retryStrategy,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    enableReadyCheck: config.enableReadyCheck,
    lazyConnect: config.lazyConnect
});

// Event handlers
redis.on('connect', () => {
    console.log('[Redis] Connected');
});

redis.on('ready', () => {
    console.log('[Redis] Ready to accept commands');
});

redis.on('error', (err) => {
    console.error('[Redis] Error:', err.message);
});

redis.on('close', () => {
    console.log('[Redis] Connection closed');
});

/**
 * Connect to Redis
 * @returns {Promise<void>}
 */
async function connect() {
    if (redis.status !== 'ready') {
        await redis.connect();
    }
}

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<string|null>}
 */
async function get(key) {
    return redis.get(key);
}

/**
 * Get and parse JSON from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
async function getJSON(key) {
    const value = await redis.get(key);
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {string} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<'OK'>}
 */
async function set(key, value, ttlSeconds = 3600) {
    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }
    if (ttlSeconds) {
        return redis.setex(key, ttlSeconds, value);
    }
    return redis.set(key, value);
}

/**
 * Delete a key from cache
 * @param {string} key - Cache key
 * @returns {Promise<number>}
 */
async function del(key) {
    return redis.del(key);
}

/**
 * Check if key exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>}
 */
async function exists(key) {
    const result = await redis.exists(key);
    return result === 1;
}

/**
 * Increment a counter (for rate limiting)
 * @param {string} key - Counter key
 * @param {number} ttlSeconds - TTL for the counter
 * @returns {Promise<number>} New counter value
 */
async function incr(key, ttlSeconds = 60) {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, ttlSeconds);
    const results = await multi.exec();
    return results[0][1];
}

/**
 * Acquire a distributed lock
 * @param {string} lockKey - Lock key
 * @param {string} lockValue - Unique value for this lock holder
 * @param {number} ttlSeconds - Lock TTL
 * @returns {Promise<boolean>} Whether lock was acquired
 */
async function acquireLock(lockKey, lockValue, ttlSeconds = 30) {
    const result = await redis.set(lockKey, lockValue, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
}

/**
 * Release a distributed lock
 * @param {string} lockKey - Lock key
 * @param {string} lockValue - Value to verify ownership
 * @returns {Promise<boolean>} Whether lock was released
 */
async function releaseLock(lockKey, lockValue) {
    const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
    const result = await redis.eval(script, 1, lockKey, lockValue);
    return result === 1;
}

/**
 * Publish message to a channel
 * @param {string} channel - Channel name
 * @param {any} message - Message to publish
 * @returns {Promise<number>}
 */
async function publish(channel, message) {
    const payload = typeof message === 'object' ? JSON.stringify(message) : message;
    return redis.publish(channel, payload);
}

/**
 * Subscribe to a channel
 * @param {string} channel - Channel name
 * @param {Function} handler - Message handler
 * @returns {Promise<void>}
 */
async function subscribe(channel, handler) {
    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
        if (ch === channel) {
            try {
                handler(JSON.parse(message));
            } catch {
                handler(message);
            }
        }
    });
    return subscriber;
}

/**
 * Health check
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch {
        return false;
    }
}

/**
 * Close connection
 * @returns {Promise<void>}
 */
async function close() {
    await redis.quit();
    console.log('[Redis] Disconnected');
}

module.exports = {
    redis,
    connect,
    get,
    getJSON,
    set,
    del,
    exists,
    incr,
    acquireLock,
    releaseLock,
    publish,
    subscribe,
    healthCheck,
    close
};
