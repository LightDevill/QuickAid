// Workflow Service - Main Server
// Handles bookings, emergency SOS, state machine

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bookingRoutes = require('./routes/bookings');
const emergencyRoutes = require('./routes/emergency');
const alertRoutes = require('./routes/alerts');
const { logger, logRequest } = require('../../shared/logger');
const db = require('../../shared/database');
const redis = require('../../shared/redis');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50kb' }));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => logRequest(req, res, Date.now() - start));
    next();
});

app.get('/health', async (req, res) => {
    const dbHealthy = await db.healthCheck();
    const redisHealthy = await redis.healthCheck();
    res.status(dbHealthy && redisHealthy ? 200 : 503).json({
        status: dbHealthy && redisHealthy ? 'healthy' : 'degraded',
        service: 'workflow-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/v1/bookings', bookingRoutes);
app.use('/v1/emergency', emergencyRoutes);
app.use('/v1/alerts', alertRoutes);
app.use('/v1/doctor', emergencyRoutes); // Doctor request endpoint

// Error handling
app.use((req, res) => res.status(404).json({ error: 'E_NOT_FOUND' }));
app.use((err, req, res, next) => {
    logger.error('Error', { error: err.message });
    res.status(500).json({ error: 'E_INTERNAL' });
});

// Graceful shutdown
async function shutdown(signal) {
    logger.info(`Received ${signal}`);
    server.close(async () => {
        await db.close();
        await redis.close();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
}

const server = app.listen(PORT, async () => {
    logger.info(`Workflow service started on port ${PORT}`);
    await redis.connect().catch(err => logger.error('Redis failed', { error: err.message }));
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
