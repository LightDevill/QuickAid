// Auth Service - Main Server
// Handles authentication, OTP, JWT issuance, and session management

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const { logger, logRequest } = require('../../shared/logger');
const db = require('../../shared/database');
const redis = require('../../shared/redis');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        logRequest(req, res, Date.now() - start);
    });
    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbHealthy = await db.healthCheck();
    const redisHealthy = await redis.healthCheck();

    const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';
    const statusCode = status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
        status,
        service: 'auth-service',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        dependencies: {
            database: dbHealthy ? 'healthy' : 'unhealthy',
            redis: redisHealthy ? 'healthy' : 'unhealthy'
        }
    });
});

// Mount auth routes
app.use('/v1/identity', authRoutes);
app.use('/v1/auth', authRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'E_NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path
    });

    res.status(err.status || 500).json({
        error: 'E_INTERNAL',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// Graceful shutdown
async function shutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully`);

    // Close server
    server.close(async () => {
        logger.info('HTTP server closed');

        // Close database and redis
        await db.close();
        await redis.close();

        process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

// Start server
const server = app.listen(PORT, async () => {
    logger.info(`Auth service started on port ${PORT}`);

    // Connect to dependencies
    try {
        await redis.connect();
        logger.info('Connected to Redis');
    } catch (err) {
        logger.error('Failed to connect to Redis', { error: err.message });
    }
});

// Handle signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
