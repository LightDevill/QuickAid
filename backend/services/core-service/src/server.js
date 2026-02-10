// Core Service - Main Server
// Manages hospitals, bed inventory, and doctors

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hospitalRoutes = require('./routes/hospitals');
const doctorRoutes = require('./routes/doctors');
const { authMiddleware } = require('./middleware/auth');
const { logger, logRequest } = require('../../shared/logger');
const db = require('../../shared/database');
const redis = require('../../shared/redis');

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => logRequest(req, res, Date.now() - start));
    next();
});

// Health check
app.get('/health', async (req, res) => {
    const dbHealthy = await db.healthCheck();
    const redisHealthy = await redis.healthCheck();
    const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';

    res.status(status === 'healthy' ? 200 : 503).json({
        status,
        service: 'core-service',
        timestamp: new Date().toISOString(),
        dependencies: { database: dbHealthy, redis: redisHealthy }
    });
});

// Routes
app.use('/v1/hospitals', hospitalRoutes);
app.use('/v1/hospital', hospitalRoutes); // Legacy compatibility
app.use('/v1/doctors', doctorRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'E_NOT_FOUND' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'E_INTERNAL' });
});

// Graceful shutdown
async function shutdown(signal) {
    logger.info(`Received ${signal}, shutting down`);
    server.close(async () => {
        await db.close();
        await redis.close();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
}

const server = app.listen(PORT, async () => {
    logger.info(`Core service started on port ${PORT}`);
    try {
        await redis.connect();
    } catch (err) {
        logger.error('Redis connection failed', { error: err.message });
    }
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
