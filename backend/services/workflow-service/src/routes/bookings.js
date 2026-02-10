// Booking Routes - Create, Status, Approve/Reject
const express = require('express');
const crypto = require('crypto');
const db = require('../../../shared/database');
const redis = require('../../../shared/redis');
const { genId, nowUTC, sha256, freshnessState } = require('../../../shared/utils');
const { logger, audit } = require('../../../shared/logger');

const router = express.Router();

// Configuration
const LOCK_DURATION_SEC = 90;
const JWT_SECRET = process.env.JWT_SECRET || 'quickaid-dev-secret';

// Auth middleware (inline for service independence)
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const headerRole = req.headers['x-role'];

    if (headerRole) {
        req.user = { role: headerRole.toLowerCase() };
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'E_AUTH_REQUIRED' });
    }

    try {
        const token = authHeader.slice(7);
        const cached = await redis.getJSON(`session:${token}`);
        if (cached) {
            req.user = cached;
            return next();
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { user_id: decoded.user_id, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'E_TOKEN_INVALID' });
    }
}

function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.map(r => r.toLowerCase()).includes(req.user.role)) {
            return res.status(403).json({ error: 'E_FORBIDDEN' });
        }
        next();
    };
}

/**
 * POST /
 * Create a new booking with idempotency and atomic bed locking
 */
router.post('/', requireAuth, requireRoles('citizen', 'hospital_admin', 'quickaid_admin'), async (req, res, next) => {
    try {
        const idempKey = req.headers['idempotency-key'];
        if (!idempKey) {
            return res.status(400).json({
                error: 'E_IDEMPOTENCY_REQUIRED',
                message: 'Idempotency-Key header is required'
            });
        }

        // Check idempotency
        const existing = await db.query(
            'SELECT * FROM bookings WHERE idempotency_key = $1',
            [idempKey]
        );

        if (existing.rows.length > 0) {
            const booking = existing.rows[0];
            return res.json({
                booking_id: booking.booking_id,
                status: booking.status,
                lock_expires_at: booking.lock_expires_at,
                qr_token: booking.qr_token,
                websocket_url: `/v1/realtime/booking/${booking.booking_id}/events`,
                idempotent: true
            });
        }

        const { hospital_id, bed_type, emergency_case_id } = req.body;

        if (!hospital_id || !bed_type) {
            return res.status(400).json({
                error: 'E_INVALID_REQUEST',
                message: 'hospital_id and bed_type required'
            });
        }

        // Verify hospital and freshness
        const hospitalResult = await db.query(
            'SELECT * FROM hospitals WHERE hospital_id = $1',
            [hospital_id]
        );

        if (hospitalResult.rows.length === 0) {
            return res.status(404).json({ error: 'E_HOSPITAL_NOT_FOUND' });
        }

        const hospital = hospitalResult.rows[0];
        const fresh = freshnessState(hospital.last_inventory_update_at);

        if (fresh === 'disabled') {
            return res.status(409).json({
                error: 'E_FRESHNESS_STALE',
                message: 'Hospital inventory is stale. Please select another hospital.'
            });
        }

        // Atomic bed locking in transaction
        const booking = await db.transaction(async (client) => {
            // Try to lock a bed
            const lockResult = await client.query(
                'SELECT lock_bed($1, $2) as locked',
                [hospital_id, bed_type.toLowerCase()]
            );

            if (!lockResult.rows[0].locked) {
                throw { status: 409, error: 'E_NO_BEDS', message: 'No beds available in this category' };
            }

            const bookingId = genId('QK');
            const lockExpiresAt = new Date(Date.now() + LOCK_DURATION_SEC * 1000).toISOString();
            const qrToken = sha256(`${bookingId}|${hospital_id}|${lockExpiresAt}`);

            await client.query(`
        INSERT INTO bookings (
          booking_id, citizen_id, hospital_id, bed_category, 
          status, lock_expires_at, qr_token, idempotency_key, emergency_case_id
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
      `, [
                bookingId,
                req.user.user_id || null,
                hospital_id,
                bed_type.toLowerCase(),
                lockExpiresAt,
                qrToken,
                idempKey,
                emergency_case_id || null
            ]);

            // Log audit
            await client.query(`
        INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id)
        VALUES ($1, $2, 'create_booking', 'booking', $3)
      `, [req.user.user_id, req.user.role, bookingId]);

            return {
                booking_id: bookingId,
                status: 'pending',
                lock_expires_at: lockExpiresAt,
                qr_token: qrToken,
                hospital_id,
                bed_category: bed_type.toLowerCase()
            };
        });

        // Schedule expiry check
        scheduleExpiryCheck(booking.booking_id, LOCK_DURATION_SEC * 1000 + 1000);

        // Publish event for SSE/WebSocket
        await redis.publish('booking:events', {
            type: 'created',
            booking_id: booking.booking_id,
            hospital_id: booking.hospital_id
        });

        logger.info('Booking created', { bookingId: booking.booking_id });

        res.status(201).json({
            ...booking,
            websocket_url: `/v1/realtime/booking/${booking.booking_id}/events`
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.error, message: err.message });
        }
        next(err);
    }
});

/**
 * Schedule expiry check for a booking
 */
function scheduleExpiryCheck(bookingId, delayMs) {
    setTimeout(async () => {
        try {
            const result = await db.query(
                "SELECT * FROM bookings WHERE booking_id = $1 AND status = 'pending'",
                [bookingId]
            );

            if (result.rows.length === 0) return;

            const booking = result.rows[0];

            // Check if lock expired
            if (new Date(booking.lock_expires_at) <= new Date()) {
                await db.transaction(async (client) => {
                    // Release the bed
                    await client.query(
                        'SELECT release_bed($1, $2, FALSE)',
                        [booking.hospital_id, booking.bed_category]
                    );

                    // Update booking status
                    await client.query(
                        "UPDATE bookings SET status = 'expired' WHERE booking_id = $1",
                        [bookingId]
                    );
                });

                await redis.publish('booking:events', {
                    type: 'expired',
                    booking_id: bookingId
                });

                logger.info('Booking expired', { bookingId });
            }
        } catch (err) {
            logger.error('Expiry check failed', { bookingId, error: err.message });
        }
    }, delayMs);
}

/**
 * GET /:id
 * Get booking status
 */
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM bookings WHERE booking_id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'E_BOOKING_NOT_FOUND' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /:id/approve
 * Approve a pending booking (admin only)
 */
router.post('/:id/approve', requireAuth, requireRoles('hospital_admin', 'quickaid_admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "SELECT * FROM bookings WHERE booking_id = $1 AND status = 'pending'",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'E_BOOKING_NOT_FOUND' });
        }

        const booking = result.rows[0];

        await db.transaction(async (client) => {
            // Move from locked to reserved
            await client.query(
                'SELECT release_bed($1, $2, TRUE)',
                [booking.hospital_id, booking.bed_category]
            );

            await client.query(`
        UPDATE bookings 
        SET status = 'approved', approved_by = $1, approved_at = NOW()
        WHERE booking_id = $2
      `, [req.user.user_id, id]);

            await client.query(`
        INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id)
        VALUES ($1, $2, 'approve_booking', 'booking', $3)
      `, [req.user.user_id, req.user.role, id]);
        });

        await redis.publish('booking:events', { type: 'approved', booking_id: id });

        logger.info('Booking approved', { bookingId: id });
        res.json({ status: 'approved' });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /:id/reject
 * Reject a pending booking (admin only)
 */
router.post('/:id/reject', requireAuth, requireRoles('hospital_admin', 'quickaid_admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "SELECT * FROM bookings WHERE booking_id = $1 AND status = 'pending'",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'E_BOOKING_NOT_FOUND' });
        }

        const booking = result.rows[0];

        await db.transaction(async (client) => {
            // Release bed back to available
            await client.query(
                'SELECT release_bed($1, $2, FALSE)',
                [booking.hospital_id, booking.bed_category]
            );

            await client.query(
                "UPDATE bookings SET status = 'rejected' WHERE booking_id = $1",
                [id]
            );

            await client.query(`
        INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id)
        VALUES ($1, $2, 'reject_booking', 'booking', $3)
      `, [req.user.user_id, req.user.role, id]);
        });

        await redis.publish('booking:events', { type: 'rejected', booking_id: id });

        logger.info('Booking rejected', { bookingId: id });
        res.json({ status: 'rejected' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
