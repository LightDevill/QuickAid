// Hospital Routes - Search, Details, Bed Management
const express = require('express');
const db = require('../../../shared/database');
const redis = require('../../../shared/redis');
const { distanceKm, freshnessState, nowUTC, genId } = require('../../../shared/utils');
const { logger, audit } = require('../../../shared/logger');
const { authMiddleware, requireRoles, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Cache TTL in seconds
const CACHE_TTL = 30;

/**
 * Hospital matching/scoring algorithm
 * Preserves logic from original modules/matching.js
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
 * GET /search
 * Search hospitals with matching algorithm
 */
router.get('/search', optionalAuth, async (req, res, next) => {
    try {
        const { lat, lng, bed_type = 'general', radius_km = 50 } = req.query;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius_km);
        const bedType = bed_type.toLowerCase();

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                error: 'E_INVALID_LOCATION',
                message: 'Valid lat and lng query parameters required'
            });
        }

        // Check cache
        const cacheKey = `hospitals:search:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${bedType}:${radiusKm}`;
        const cached = await redis.getJSON(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        // Query hospitals with bed inventory
        const result = await db.query(`
      SELECT 
        h.hospital_id, h.name, h.address, h.city, h.lat, h.lng,
        h.emergency_rating, h.reliability_score, h.surge_mode,
        h.last_inventory_update_at, h.is_verified,
        bc.category, bc.total, bc.available, bc.reserved, bc.locked, bc.price_per_day
      FROM hospitals h
      LEFT JOIN bed_categories bc ON h.hospital_id = bc.hospital_id
      WHERE h.is_verified = TRUE
      ORDER BY h.hospital_id
    `);

        // Group by hospital
        const hospitalsMap = new Map();
        for (const row of result.rows) {
            if (!hospitalsMap.has(row.hospital_id)) {
                hospitalsMap.set(row.hospital_id, {
                    hospital_id: row.hospital_id,
                    name: row.name,
                    address: row.address,
                    city: row.city,
                    lat: parseFloat(row.lat),
                    lng: parseFloat(row.lng),
                    emergency_rating: parseFloat(row.emergency_rating || 0),
                    reliability_score: parseFloat(row.reliability_score || 0.5),
                    surge_mode: row.surge_mode,
                    last_inventory_update_at: row.last_inventory_update_at,
                    beds: new Map()
                });
            }
            if (row.category) {
                hospitalsMap.get(row.hospital_id).beds.set(row.category, {
                    total: row.total,
                    available: row.available,
                    reserved: row.reserved,
                    locked: row.locked,
                    price_per_day: parseFloat(row.price_per_day || 0)
                });
            }
        }

        // Filter and score
        const results = [];
        for (const h of hospitalsMap.values()) {
            const dist = distanceKm(latitude, longitude, h.lat, h.lng);
            if (dist > radiusKm) continue;

            const bedData = h.beds.get(bedType);
            if (!bedData) continue;

            const fresh = freshnessState(h.last_inventory_update_at);
            const icu = h.beds.has('icu') && h.beds.get('icu').total > 0;
            const oxygen = h.beds.has('oxygen') && h.beds.get('oxygen').total > 0;
            const availability = bedData.available > 0
                ? Math.min(1, bedData.available / Math.max(1, bedData.total))
                : 0;

            const surgePenalty = h.surge_mode ? 0.1 : 0.0;
            const score = scoreHospital({
                distKm: dist,
                availability,
                icu,
                oxygen,
                reliability: h.reliability_score
            }) - surgePenalty;

            results.push({
                hospital_id: h.hospital_id,
                name: h.name,
                address: h.address,
                city: h.city,
                distance_km: Number(dist.toFixed(2)),
                bed_available: bedData.available,
                bed_total: bedData.total,
                price_per_day: bedData.price_per_day,
                freshness_state: fresh,
                icu,
                oxygen,
                reliability_score: h.reliability_score,
                surge_mode: h.surge_mode,
                score: Number(score.toFixed(4))
            });
        }

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);
        const topResults = results.slice(0, 20);

        // Cache results
        await redis.set(cacheKey, topResults, CACHE_TTL);

        res.json(topResults);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /:id
 * Get hospital details
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check cache
        const cacheKey = `hospital:${id}`;
        const cached = await redis.getJSON(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const hospitalResult = await db.query(
            'SELECT * FROM hospitals WHERE hospital_id = $1',
            [id]
        );

        if (hospitalResult.rows.length === 0) {
            return res.status(404).json({ error: 'E_HOSPITAL_NOT_FOUND' });
        }

        const bedsResult = await db.query(
            'SELECT * FROM bed_categories WHERE hospital_id = $1',
            [id]
        );

        const doctorsResult = await db.query(
            'SELECT doctor_id, name, specialty, is_on_duty FROM doctors WHERE hospital_id = $1 AND is_active = TRUE',
            [id]
        );

        const hospital = hospitalResult.rows[0];
        const response = {
            ...hospital,
            freshness_state: freshnessState(hospital.last_inventory_update_at),
            beds: bedsResult.rows,
            doctors_on_duty: doctorsResult.rows.filter(d => d.is_on_duty)
        };

        await redis.set(cacheKey, response, CACHE_TTL);

        res.json(response);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /updateBeds or POST /:id/beds
 * Update bed inventory (admin only)
 */
router.post(['/updateBeds', '/:id/beds'], authMiddleware, requireRoles('hospital_admin', 'quickaid_admin'), async (req, res, next) => {
    try {
        const hospitalId = req.params.id || req.body.hospital_id;
        const { updates } = req.body;

        if (!hospitalId || !Array.isArray(updates)) {
            return res.status(400).json({
                error: 'E_INVALID_REQUEST',
                message: 'hospital_id and updates array required'
            });
        }

        // Verify hospital exists
        const hospitalResult = await db.query(
            'SELECT * FROM hospitals WHERE hospital_id = $1',
            [hospitalId]
        );

        if (hospitalResult.rows.length === 0) {
            return res.status(404).json({ error: 'E_HOSPITAL_NOT_FOUND' });
        }

        // Update bed categories in transaction
        await db.transaction(async (client) => {
            for (const u of updates) {
                const category = String(u.category || '').toLowerCase();
                if (!category) continue;

                // Get current state for audit
                const current = await client.query(
                    'SELECT * FROM bed_categories WHERE hospital_id = $1 AND category = $2',
                    [hospitalId, category]
                );

                if (current.rows.length === 0) continue;

                const before = current.rows[0];
                const updateFields = [];
                const values = [hospitalId, category];
                let paramIndex = 3;

                if (typeof u.total === 'number') {
                    updateFields.push(`total = $${paramIndex++}`);
                    values.push(Math.max(0, u.total));
                }
                if (typeof u.available === 'number') {
                    updateFields.push(`available = $${paramIndex++}`);
                    values.push(Math.max(0, u.available));
                }
                if (typeof u.reserved === 'number') {
                    updateFields.push(`reserved = $${paramIndex++}`);
                    values.push(Math.max(0, u.reserved));
                }
                if (typeof u.locked === 'number') {
                    updateFields.push(`locked = $${paramIndex++}`);
                    values.push(Math.max(0, u.locked));
                }

                if (updateFields.length > 0) {
                    await client.query(`
            UPDATE bed_categories 
            SET ${updateFields.join(', ')}, updated_at = NOW()
            WHERE hospital_id = $1 AND category = $2
          `, values);

                    audit('updateBeds', {
                        actor: req.user?.user_id,
                        role: req.user?.role,
                        hospital_id: hospitalId,
                        category,
                        before: { available: before.available, total: before.total },
                        updates: u
                    });
                }
            }

            // Update hospital freshness
            await client.query(
                'UPDATE hospitals SET last_inventory_update_at = NOW() WHERE hospital_id = $1',
                [hospitalId]
            );
        });

        // Invalidate cache
        await redis.del(`hospital:${hospitalId}`);

        const hospital = await db.query(
            'SELECT last_inventory_update_at FROM hospitals WHERE hospital_id = $1',
            [hospitalId]
        );

        res.json({
            status: 'ok',
            freshness: freshnessState(hospital.rows[0].last_inventory_update_at)
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
