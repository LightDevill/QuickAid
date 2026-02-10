// Emergency Routes - SOS, Doctor Request
const express = require('express');
const db = require('../../../shared/database');
const redis = require('../../../shared/redis');
const { genId, distanceKm, freshnessState } = require('../../../shared/utils');
const { logger, audit } = require('../../../shared/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quickaid-dev-secret';

// Rate limit config
const SOS_RATE_LIMIT = 5;
const SOS_RATE_WINDOW = 60;

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

/**
 * Hospital scoring algorithm (same as original)
 */
function scoreHospital({ distKm, availability, icu, oxygen, reliability }) {
    const w = { distance: 0.40, availability: 0.25, icu: 0.15, oxygen: 0.10, reliability: 0.10 };
    const distanceScore = Math.max(0, 1 - Math.min(distKm, 20) / 20);
    return (
        w.distance * distanceScore +
        w.availability * availability +
        w.icu * (icu ? 1 : 0) +
        w.oxygen * (oxygen ? 1 : 0) +
        w.reliability * reliability
    );
}

/**
 * POST /sos
 * Create emergency SOS case with hospital matching
 */
router.post('/sos', requireAuth, async (req, res, next) => {
    try {
        // Rate limiting
        const rlKey = `ratelimit:sos:${req.user.user_id || req.ip}`;
        const count = await redis.incr(rlKey, SOS_RATE_WINDOW);
        if (count > SOS_RATE_LIMIT) {
            return res.status(429).json({ error: 'E_RATE_LIMIT' });
        }

        const { severity = 'high', symptoms, location } = req.body;

        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return res.status(400).json({
                error: 'E_INVALID_LOCATION',
                message: 'location with lat and lng required'
            });
        }

        const emergencyCaseId = genId('EMR');

        // Create emergency case
        await db.query(`
      INSERT INTO emergency_cases (emergency_case_id, user_id, severity, symptoms, location, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
    `, [
            emergencyCaseId,
            req.user.user_id || null,
            String(severity).toLowerCase(),
            JSON.stringify(symptoms || []),
            JSON.stringify(location)
        ]);

        audit('sos_created', {
            emergency_case_id: emergencyCaseId,
            user_id: req.user.user_id,
            severity,
            location
        });

        // Find matching hospitals
        const hospitalsResult = await db.query(`
      SELECT 
        h.hospital_id, h.name, h.lat, h.lng, h.reliability_score, h.surge_mode,
        h.last_inventory_update_at,
        bc.category, bc.total, bc.available
      FROM hospitals h
      LEFT JOIN bed_categories bc ON h.hospital_id = bc.hospital_id
      WHERE h.is_verified = TRUE
    `);

        // Group and score
        const hospitalsMap = new Map();
        for (const row of hospitalsResult.rows) {
            if (!hospitalsMap.has(row.hospital_id)) {
                hospitalsMap.set(row.hospital_id, {
                    hospital_id: row.hospital_id,
                    name: row.name,
                    lat: parseFloat(row.lat),
                    lng: parseFloat(row.lng),
                    reliability_score: parseFloat(row.reliability_score || 0.5),
                    surge_mode: row.surge_mode,
                    last_inventory_update_at: row.last_inventory_update_at,
                    beds: new Map()
                });
            }
            if (row.category) {
                hospitalsMap.get(row.hospital_id).beds.set(row.category, {
                    total: row.total,
                    available: row.available
                });
            }
        }

        const candidates = [];
        for (const h of hospitalsMap.values()) {
            const dist = distanceKm(location.lat, location.lng, h.lat, h.lng);
            if (dist > 50) continue;

            const generalBed = h.beds.get('general') || { total: 0, available: 0 };
            const fresh = freshnessState(h.last_inventory_update_at);
            const icu = h.beds.has('icu') && h.beds.get('icu').total > 0;
            const oxygen = h.beds.has('oxygen') && h.beds.get('oxygen').total > 0;
            const availability = generalBed.available > 0
                ? Math.min(1, generalBed.available / Math.max(1, generalBed.total))
                : 0;

            const score = scoreHospital({
                distKm: dist,
                availability,
                icu,
                oxygen,
                reliability: h.reliability_score
            }) - (h.surge_mode ? 0.1 : 0);

            candidates.push({
                hospital_id: h.hospital_id,
                name: h.name,
                distance_km: Number(dist.toFixed(2)),
                bed_available: generalBed.available,
                freshness_state: fresh,
                icu,
                oxygen,
                score: Number(score.toFixed(4))
            });
        }

        candidates.sort((a, b) => b.score - a.score);

        logger.info('Emergency SOS created', { emergencyCaseId, candidateCount: candidates.length });

        res.json({
            emergency_case_id: emergencyCaseId,
            candidates: candidates.slice(0, 10),
            websocket_url: `/v1/realtime/booking/${emergencyCaseId}/events`
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /request (or /v1/doctor/request)
 * Request a doctor for emergency case
 */
router.post('/request', requireAuth, async (req, res, next) => {
    try {
        const { emergency_case_id, context, preferred_specialty } = req.body;

        if (!emergency_case_id) {
            return res.status(400).json({ error: 'E_INVALID_REQUEST' });
        }

        // Find available doctor
        let doctorQuery = `
      SELECT d.*, h.name as hospital_name 
      FROM doctors d
      JOIN hospitals h ON d.hospital_id = h.hospital_id
      WHERE d.is_active = TRUE AND d.is_on_duty = TRUE
    `;
        const params = [];

        if (preferred_specialty) {
            params.push(`%${preferred_specialty.toLowerCase()}%`);
            doctorQuery += ` AND LOWER(d.specialty) LIKE $1`;
        }

        doctorQuery += ' LIMIT 1';

        const doctorResult = await db.query(doctorQuery, params);

        if (doctorResult.rows.length === 0) {
            return res.status(409).json({
                error: 'E_POOL_EMPTY',
                message: 'No doctors currently available'
            });
        }

        const doctor = doctorResult.rows[0];
        const requestId = genId('DOC');

        await db.query(`
      INSERT INTO doctor_requests (request_id, emergency_case_id, doctor_id, status, preferred_specialty, context, assigned_at)
      VALUES ($1, $2, $3, 'assigned', $4, $5, NOW())
    `, [requestId, emergency_case_id, doctor.doctor_id, preferred_specialty, context]);

        logger.info('Doctor assigned', { requestId, doctorId: doctor.doctor_id });

        res.json({
            request_id: requestId,
            assigned_doctor: {
                name: doctor.name,
                specialty: doctor.specialty,
                contact: doctor.contact
            },
            eta_sec: 60
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
