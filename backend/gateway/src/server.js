// API Gateway - Main Server
// Routes requests to microservices with rate limiting and circuit breakers

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const CircuitBreaker = require('opossum');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 8080;

// Service URLs
const SERVICES = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    core: process.env.CORE_SERVICE_URL || 'http://localhost:3002',
    workflow: process.env.WORKFLOW_SERVICE_URL || 'http://localhost:3003',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005'
};

// Redis for rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Circuit breaker options
const circuitOptions = {
    timeout: 5000,              // 5 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000         // 30 seconds
};

// Create circuit breakers for each service
const circuits = {};
for (const [name, url] of Object.entries(SERVICES)) {
    circuits[name] = new CircuitBreaker(
        async (req, res, next) => next(),
        circuitOptions
    );

    circuits[name].on('open', () => {
        console.log(`[Circuit] ${name} circuit OPEN - service unavailable`);
    });

    circuits[name].on('halfOpen', () => {
        console.log(`[Circuit] ${name} circuit HALF-OPEN - testing`);
    });

    circuits[name].on('close', () => {
        console.log(`[Circuit] ${name} circuit CLOSED - service restored`);
    });
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false  // Allow proxying
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Role', 'X-Signature']
}));

// Rate limiting middleware
async function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `ratelimit:gateway:${ip}`;

    try {
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, 60);
        }

        const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

        if (count > limit) {
            return res.status(429).json({
                error: 'E_RATE_LIMIT',
                message: 'Too many requests',
                retry_after_seconds: 60
            });
        }

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

        next();
    } catch (err) {
        // If Redis fails, allow request
        next();
    }
}

app.use(rateLimit);

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`[Gateway] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
});

// Health check (aggregated)
app.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {}
    };

    for (const [name, circuit] of Object.entries(circuits)) {
        health.services[name] = {
            status: circuit.opened ? 'unhealthy' : 'healthy',
            circuit: circuit.opened ? 'open' : 'closed'
        };
        if (circuit.opened) {
            health.status = 'degraded';
        }
    }

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Proxy configuration helper
function createServiceProxy(serviceName, serviceUrl, pathRewrite = {}) {
    return createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        pathRewrite,
        onError: (err, req, res) => {
            console.error(`[Proxy] ${serviceName} error:`, err.message);

            if (!res.headersSent) {
                res.status(503).json({
                    error: 'E_SERVICE_UNAVAILABLE',
                    service: serviceName,
                    message: 'Service temporarily unavailable'
                });
            }
        },
        onProxyReq: (proxyReq, req) => {
            // Forward original IP
            proxyReq.setHeader('X-Forwarded-For', req.ip);
            proxyReq.setHeader('X-Request-ID', `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        }
    });
}

// Route mapping to services

// Auth Service
app.use('/v1/identity', createServiceProxy('auth', SERVICES.auth));
app.use('/v1/auth', createServiceProxy('auth', SERVICES.auth));
app.use('/v1/admin/mockLogin', createServiceProxy('auth', SERVICES.auth, {
    '^/v1/admin/mockLogin': '/v1/auth/admin/mockLogin'
}));

// Core Service
app.use('/v1/hospitals', createServiceProxy('core', SERVICES.core));
app.use('/v1/hospital', createServiceProxy('core', SERVICES.core));
app.use('/v1/doctors', createServiceProxy('core', SERVICES.core));

// Workflow Service
app.use('/v1/bookings', createServiceProxy('workflow', SERVICES.workflow));
app.use('/v1/emergency', createServiceProxy('workflow', SERVICES.workflow));
app.use('/v1/doctor', createServiceProxy('workflow', SERVICES.workflow));
app.use('/v1/alerts', createServiceProxy('workflow', SERVICES.workflow));

// Notification Service (SSE/WebSocket)
app.use('/v1/realtime', createServiceProxy('notification', SERVICES.notification));
app.use('/notify', createServiceProxy('notification', SERVICES.notification));

// Analytics Service
app.use('/v1/analytics', createServiceProxy('analytics', SERVICES.analytics));

// Legacy monolith fallback (for backward compatibility during migration)
if (process.env.LEGACY_MONOLITH_URL) {
    app.use('/', createServiceProxy('legacy', process.env.LEGACY_MONOLITH_URL));
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'E_NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Gateway] Error:', err.message);
    res.status(500).json({
        error: 'E_INTERNAL',
        message: 'Gateway error'
    });
});

// Graceful shutdown
async function shutdown(signal) {
    console.log(`[Gateway] Received ${signal}, shutting down`);

    server.close(() => {
        redis.quit();
        process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000);
}

const server = app.listen(PORT, () => {
    console.log(`[Gateway] API Gateway started on port ${PORT}`);
    console.log('[Gateway] Service routes:');
    console.log(`  - Auth: ${SERVICES.auth}`);
    console.log(`  - Core: ${SERVICES.core}`);
    console.log(`  - Workflow: ${SERVICES.workflow}`);
    console.log(`  - Notification: ${SERVICES.notification}`);
    console.log(`  - Analytics: ${SERVICES.analytics}`);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
