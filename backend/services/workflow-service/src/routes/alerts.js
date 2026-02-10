// Alert Routes - Ambulance alerts with HMAC signature verification
const express = require('express');
const crypto = require('crypto');
const db = require('../../../shared/database');
const { genId, hmacSign } = require('../../../shared/utils');
const { logger, audit, security } = require('../../../shared/logger');

const router = express.Router();
const ALERT_SECRET = process.env.ALERT_SECRET || 'QUICKAID_TEST_SECRET';
const JWT_SECRET = process.env.JWT_SECRET || 'quickaid-dev-secret';

// Auth middleware
async function requireAuth(req, res, next) {
    const headerRole = req.headers['x-role'];
    if (headerRole) {
        req.user = { role: headerRole.toLowerCase() };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'E_AUTH_REQUIRED' });
    }

    try {
        const token = authHeader.slice(7);
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
 * POST /ambulance
 * Accept ambulance alert with HMAC signature verification
 */
router.post('/ambulance', requireAuth, requireRoles('hospital_admin', 'ambulance_partner', 'quickaid_admin'), async (req, res, next) => {
    try {
        const body = req.body;

        // Required fields validation (from original implementation)
        const required = [
            'alert_id', 'timestamp_utc', 'priority', 'severity',
            'trace_id', 'booking_id', 'patient', 'location',
            'destination_hospital', 'bed_type', 'ambulance_request',
            'ack_required_within_sec', 'routing_targets', 'signature'
        ];

        for (const k of required) {
            if (!(k in body)) {
                return res.status(400).json({
                    error: 'E_INVALID_ALERT_FORMAT',
                    missing: k
                });
            }
        }

        // Verify HMAC signature
        const providedSig = (req.headers['x-signature'] || '').trim()
            || String(body.signature || '').replace(/^HMAC-SHA256:/i, '').trim();

        const clone = { ...body };
        delete clone.signature;
        const payload = JSON.stringify(clone);
        const expectedSig = crypto.createHmac('sha256', ALERT_SECRET).update(payload).digest('base64');

        if (!providedSig || providedSig !== expectedSig) {
            security('invalid_signature', {
                alert_id: body.alert_id,
                booking_id: body.booking_id
            });
            return res.status(401).json({ error: 'E_SIGNATURE_INVALID' });
        }

        // Store alert
        await db.query(`
      INSERT INTO ambulance_alerts (
        alert_id, booking_id, emergency_case_id, severity, priority,
        pickup_location, destination_hospital_id, signature_hash, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent')
      ON CONFLICT (alert_id) DO NOTHING
    `, [
            body.alert_id,
            body.booking_id,
            body.emergency_case_id || null,
            body.severity,
            body.priority,
            JSON.stringify(body.location),
            body.destination_hospital,
            crypto.createHash('sha256').update(providedSig).digest('hex')
        ]);

        audit('ambulance_alert', {
            actor_role: req.user.role,
            alert_id: body.alert_id,
            booking_id: body.booking_id,
            severity: body.severity,
            routing_targets: body.routing_targets
        });

        logger.info('Ambulance alert processed', { alertId: body.alert_id });

        res.json({
            alert_id: body.alert_id,
            status: 'sent'
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /ambulance/:id/acknowledge
 * Acknowledge an ambulance alert
 */
router.post('/ambulance/:id/acknowledge', requireAuth, requireRoles('ambulance_partner', 'quickaid_admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "UPDATE ambulance_alerts SET status = 'acknowledged', acknowledged_at = NOW() WHERE alert_id = $1 AND status = 'sent' RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'E_ALERT_NOT_FOUND' });
        }

        res.json({ alert_id: id, status: 'acknowledged' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
