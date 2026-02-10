// Analytics Service - Main Server
// Metrics, Dashboard, Reports

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('../../shared/database');
const redis = require('../../shared/redis');
const { logger, logRequest } = require('../../shared/logger');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => logRequest(req, res, Date.now() - start));
    next();
});

// Health check
app.get('/health', async (req, res) => {
    const dbHealthy = await db.healthCheck();
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'degraded',
        service: 'analytics-service',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /v1/analytics/dashboard
 * Real-time dashboard statistics
 */
app.get('/v1/analytics/dashboard', async (req, res, next) => {
    try {
        // Try cache first
        const cached = await redis.getJSON('analytics:dashboard');
        if (cached) {
            return res.json({ ...cached, cached: true });
        }

        // Total hospitals
        const hospitalsResult = await db.query(
            'SELECT COUNT(*) as count FROM hospitals WHERE is_verified = TRUE'
        );

        // Total beds overview
        const bedsResult = await db.query(`
      SELECT 
        SUM(total) as total_beds,
        SUM(available) as available_beds,
        SUM(reserved) as reserved_beds,
        SUM(locked) as locked_beds
      FROM bed_categories
    `);

        // Today's bookings
        const todayBookingsResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'expired') as expired
      FROM bookings
      WHERE DATE(created_at) = CURRENT_DATE
    `);

        // Emergency cases today
        const emergencyResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved
      FROM emergency_cases
      WHERE DATE(created_at) = CURRENT_DATE
    `);

        // Average response time (last 24h)
        const responseTimeResult = await db.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (approved_at - created_at))) as avg_response_seconds
      FROM bookings
      WHERE approved_at IS NOT NULL
        AND created_at > NOW() - INTERVAL '24 hours'
    `);

        const dashboard = {
            timestamp: new Date().toISOString(),
            hospitals: {
                total: parseInt(hospitalsResult.rows[0].count)
            },
            beds: {
                total: parseInt(bedsResult.rows[0].total_beds || 0),
                available: parseInt(bedsResult.rows[0].available_beds || 0),
                reserved: parseInt(bedsResult.rows[0].reserved_beds || 0),
                locked: parseInt(bedsResult.rows[0].locked_beds || 0),
                utilization_percent: bedsResult.rows[0].total_beds > 0
                    ? (100 - (bedsResult.rows[0].available_beds / bedsResult.rows[0].total_beds * 100)).toFixed(1)
                    : 0
            },
            bookings_today: {
                total: parseInt(todayBookingsResult.rows[0].total),
                approved: parseInt(todayBookingsResult.rows[0].approved),
                pending: parseInt(todayBookingsResult.rows[0].pending),
                rejected: parseInt(todayBookingsResult.rows[0].rejected),
                expired: parseInt(todayBookingsResult.rows[0].expired)
            },
            emergencies_today: {
                total: parseInt(emergencyResult.rows[0].total),
                open: parseInt(emergencyResult.rows[0].open),
                resolved: parseInt(emergencyResult.rows[0].resolved)
            },
            performance: {
                avg_response_time_seconds: Math.round(responseTimeResult.rows[0].avg_response_seconds || 0)
            }
        };

        // Cache for 30 seconds
        await redis.set('analytics:dashboard', dashboard, 30);

        res.json(dashboard);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /v1/analytics/bookings/report
 * Booking reports with date range
 */
app.get('/v1/analytics/bookings/report', async (req, res, next) => {
    try {
        const { start_date, end_date, hospital_id } = req.query;
        const startDate = start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end_date || new Date().toISOString().split('T')[0];

        let query = `
      SELECT 
        DATE(created_at) as date,
        hospital_id,
        h.name as hospital_name,
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        AVG(EXTRACT(EPOCH FROM (COALESCE(approved_at, updated_at) - created_at))) as avg_processing_seconds
      FROM bookings b
      JOIN hospitals h ON b.hospital_id = h.hospital_id
      WHERE DATE(b.created_at) BETWEEN $1 AND $2
    `;

        const params = [startDate, endDate];

        if (hospital_id) {
            params.push(hospital_id);
            query += ` AND b.hospital_id = $${params.length}`;
        }

        query += ` GROUP BY DATE(b.created_at), b.hospital_id, h.name ORDER BY date DESC, total_bookings DESC`;

        const result = await db.query(query, params);

        res.json({
            period: { start: startDate, end: endDate },
            data: result.rows.map(row => ({
                ...row,
                total_bookings: parseInt(row.total_bookings),
                approved: parseInt(row.approved),
                rejected: parseInt(row.rejected),
                expired: parseInt(row.expired),
                avg_processing_seconds: Math.round(row.avg_processing_seconds || 0)
            }))
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /v1/analytics/hospitals/performance
 * Hospital performance metrics
 */
app.get('/v1/analytics/hospitals/performance', async (req, res, next) => {
    try {
        const result = await db.query(`
      SELECT 
        h.hospital_id,
        h.name,
        h.reliability_score,
        h.surge_mode,
        COUNT(b.booking_id) as total_bookings,
        COUNT(b.booking_id) FILTER (WHERE b.status = 'approved') as approved_bookings,
        ROUND(COUNT(b.booking_id) FILTER (WHERE b.status = 'approved')::numeric / NULLIF(COUNT(b.booking_id), 0) * 100, 1) as approval_rate,
        SUM(bc.total) as total_beds,
        SUM(bc.available) as available_beds,
        ROUND((SUM(bc.total) - SUM(bc.available))::numeric / NULLIF(SUM(bc.total), 0) * 100, 1) as bed_utilization
      FROM hospitals h
      LEFT JOIN bookings b ON h.hospital_id = b.hospital_id AND b.created_at > NOW() - INTERVAL '30 days'
      LEFT JOIN bed_categories bc ON h.hospital_id = bc.hospital_id
      WHERE h.is_verified = TRUE
      GROUP BY h.hospital_id, h.name, h.reliability_score, h.surge_mode
      ORDER BY total_bookings DESC
    `);

        res.json({
            period: 'last_30_days',
            hospitals: result.rows.map(row => ({
                ...row,
                total_bookings: parseInt(row.total_bookings || 0),
                approved_bookings: parseInt(row.approved_bookings || 0),
                approval_rate: parseFloat(row.approval_rate || 0),
                total_beds: parseInt(row.total_beds || 0),
                available_beds: parseInt(row.available_beds || 0),
                bed_utilization: parseFloat(row.bed_utilization || 0)
            }))
        });
    } catch (err) {
        next(err);
    }
});

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
    logger.info(`Analytics service started on port ${PORT}`);
    await redis.connect().catch(err => logger.error('Redis failed', { error: err.message }));
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
