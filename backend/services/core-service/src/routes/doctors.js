// Doctor Routes
const express = require('express');
const db = require('../../../shared/database');
const redis = require('../../../shared/redis');
const { logger } = require('../../../shared/logger');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /available
 * Get available doctors (on duty)
 */
router.get('/available', optionalAuth, async (req, res, next) => {
    try {
        const { hospital_id, specialty } = req.query;

        let query = `
      SELECT d.doctor_id, d.name, d.specialty, d.qualification,
             d.shift_start, d.shift_end, d.hospital_id,
             h.name as hospital_name
      FROM doctors d
      JOIN hospitals h ON d.hospital_id = h.hospital_id
      WHERE d.is_active = TRUE AND d.is_on_duty = TRUE
    `;
        const params = [];

        if (hospital_id) {
            params.push(hospital_id);
            query += ` AND d.hospital_id = $${params.length}`;
        }

        if (specialty) {
            params.push(`%${specialty.toLowerCase()}%`);
            query += ` AND LOWER(d.specialty) LIKE $${params.length}`;
        }

        query += ' ORDER BY d.name';

        const result = await db.query(query, params);

        res.json({
            doctors: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /:id
 * Get doctor details
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
      SELECT d.*, h.name as hospital_name
      FROM doctors d
      JOIN hospitals h ON d.hospital_id = h.hospital_id
      WHERE d.doctor_id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'E_DOCTOR_NOT_FOUND' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
