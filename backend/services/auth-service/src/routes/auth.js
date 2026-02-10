// Auth Routes - OTP, JWT, Session Management
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../../shared/database');
const redis = require('../../../shared/redis');
const { genId, sha256, nowUTC, sanitizePhone, validateRequired } = require('../../../shared/utils');
const { logger, audit, security } = require('../../../shared/logger');

const router = express.Router();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'quickaid-dev-secret';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const OTP_TTL_SEC = 180; // 3 minutes
const OTP_MAX_ATTEMPTS = 3;
const RATE_LIMIT_OTP = parseInt(process.env.OTP_RATE_LIMIT || '5', 10);

// Rate limiting middleware for OTP
async function rateLimitOTP(req, res, next) {
    const phone = req.body.phone;
    if (!phone) return next();

    const key = `ratelimit:otp:${sanitizePhone(phone)}`;
    const count = await redis.incr(key, 60);

    if (count > RATE_LIMIT_OTP) {
        security('rate_limit_exceeded', { phone, endpoint: 'otp' });
        return res.status(429).json({
            error: 'E_RATE_LIMIT',
            message: 'Too many OTP requests. Please wait before trying again.',
            retry_after_seconds: 60
        });
    }

    next();
}

/**
 * POST /otp/send
 * Send OTP to phone number
 */
router.post('/otp/send', rateLimitOTP, async (req, res, next) => {
    try {
        const { phone, aadhaar_number } = req.body;

        // Validate
        const validation = validateRequired(req.body, ['phone']);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'E_INVALID_REQUEST',
                missing: validation.missing
            });
        }

        const normalizedPhone = sanitizePhone(phone);

        // Generate OTP (6 digits)
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = sha256(otp);
        const requestId = genId('OTP');
        const expiresAt = new Date(Date.now() + OTP_TTL_SEC * 1000).toISOString();

        // Store in database
        await db.query(`
      INSERT INTO otp_requests (request_id, phone, otp_hash, expires_at, max_attempts)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (request_id) DO NOTHING
    `, [requestId, normalizedPhone, otpHash, expiresAt, OTP_MAX_ATTEMPTS]);

        // Also cache in Redis for faster verification
        await redis.set(`otp:${requestId}`, JSON.stringify({
            phone: normalizedPhone,
            otpHash,
            attempts: 0,
            aadhaar_number
        }), OTP_TTL_SEC);

        // In production, integrate with SMS provider
        // await smsService.send(normalizedPhone, `Your QUICKAID verification code is: ${otp}`);

        logger.info('OTP sent', { requestId, phone: normalizedPhone });

        // In development, include OTP in response for testing
        const response = {
            request_id: requestId,
            ttl_sec: OTP_TTL_SEC,
            message: 'OTP sent successfully'
        };

        if (process.env.NODE_ENV !== 'production') {
            response.otp_dev_only = otp;
        }

        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /otp/verify
 * Verify OTP and issue JWT tokens
 */
router.post('/otp/verify', async (req, res, next) => {
    try {
        const { request_id, otp, aadhaar_number } = req.body;

        // Validate
        const validation = validateRequired(req.body, ['request_id', 'otp']);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'E_INVALID_REQUEST',
                missing: validation.missing
            });
        }

        // Get OTP data from Redis (faster) or DB
        let otpData = await redis.getJSON(`otp:${request_id}`);

        if (!otpData) {
            // Fallback to database
            const result = await db.query(
                'SELECT * FROM otp_requests WHERE request_id = $1 AND expires_at > NOW() AND verified_at IS NULL',
                [request_id]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({
                    error: 'E_OTP_INVALID',
                    message: 'OTP request not found or expired'
                });
            }

            otpData = {
                phone: result.rows[0].phone,
                otpHash: result.rows[0].otp_hash,
                attempts: result.rows[0].attempts
            };
        }

        // Check attempts
        if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
            security('otp_max_attempts', { request_id, phone: otpData.phone });
            return res.status(400).json({
                error: 'E_OTP_MAX_ATTEMPTS',
                message: 'Maximum verification attempts exceeded'
            });
        }

        // Verify OTP
        const providedHash = sha256(otp);
        if (providedHash !== otpData.otpHash) {
            // Increment attempts
            otpData.attempts += 1;
            await redis.set(`otp:${request_id}`, JSON.stringify(otpData), 60);
            await db.query(
                'UPDATE otp_requests SET attempts = attempts + 1 WHERE request_id = $1',
                [request_id]
            );

            security('otp_invalid', { request_id, attempts: otpData.attempts });
            return res.status(400).json({
                error: 'E_OTP_INVALID',
                message: 'Invalid OTP',
                attempts_remaining: OTP_MAX_ATTEMPTS - otpData.attempts
            });
        }

        // OTP is valid - mark as verified
        await redis.del(`otp:${request_id}`);
        await db.query(
            'UPDATE otp_requests SET verified_at = NOW() WHERE request_id = $1',
            [request_id]
        );

        // Find or create user
        let user;
        const existingUser = await db.query(
            'SELECT * FROM users WHERE phone = $1',
            [otpData.phone]
        );

        if (existingUser.rows.length > 0) {
            user = existingUser.rows[0];
        } else {
            // Create new user
            const userId = genId('USR');
            let aadhaarHash = null;
            let aadhaarLast4 = null;

            if (aadhaar_number || otpData.aadhaar_number) {
                const aadhaar = String(aadhaar_number || otpData.aadhaar_number);
                aadhaarHash = sha256(aadhaar);
                aadhaarLast4 = aadhaar.slice(-4);
            }

            const newUser = await db.query(`
        INSERT INTO users (user_id, phone, aadhaar_hash, aadhaar_last4, role, is_verified)
        VALUES ($1, $2, $3, $4, 'citizen', TRUE)
        RETURNING *
      `, [userId, otpData.phone, aadhaarHash, aadhaarLast4]);

            user = newUser.rows[0];
            audit('user_created', { userId, phone: otpData.phone });
        }

        // Generate JWT tokens
        const accessToken = jwt.sign({
            user_id: user.user_id,
            phone: user.phone,
            role: user.role,
            type: 'access'
        }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

        const refreshToken = jwt.sign({
            user_id: user.user_id,
            type: 'refresh'
        }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

        // Store session
        const sessionId = genId('SES');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        await db.query(`
      INSERT INTO sessions (session_id, user_id, token, refresh_token, role, expires_at, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [sessionId, user.user_id, accessToken, refreshToken, user.role, expiresAt, req.ip]);

        // Also cache session in Redis
        await redis.set(`session:${accessToken}`, JSON.stringify({
            user_id: user.user_id,
            role: user.role,
            session_id: sessionId
        }), 900); // 15 minutes

        audit('user_login', { userId: user.user_id, phone: user.phone });
        logger.info('User authenticated', { userId: user.user_id });

        res.status(200).json({
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 900,
            user: {
                user_id: user.user_id,
                phone: user.phone,
                name: user.name,
                role: user.role,
                aadhaar_verified: !!user.aadhaar_hash
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({
                error: 'E_INVALID_REQUEST',
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refresh_token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                error: 'E_TOKEN_INVALID',
                message: 'Invalid or expired refresh token'
            });
        }

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                error: 'E_TOKEN_INVALID',
                message: 'Invalid token type'
            });
        }

        // Get user
        const userResult = await db.query(
            'SELECT * FROM users WHERE user_id = $1',
            [decoded.user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'E_USER_NOT_FOUND'
            });
        }

        const user = userResult.rows[0];

        // Generate new access token
        const accessToken = jwt.sign({
            user_id: user.user_id,
            phone: user.phone,
            role: user.role,
            type: 'access'
        }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

        // Update session
        await db.query(`
      UPDATE sessions SET token = $1 WHERE refresh_token = $2
    `, [accessToken, refresh_token]);

        // Cache new session
        await redis.set(`session:${accessToken}`, JSON.stringify({
            user_id: user.user_id,
            role: user.role
        }), 900);

        res.status(200).json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 900
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /logout
 * Invalidate session
 */
router.post('/logout', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(200).json({ message: 'Logged out' });
        }

        const token = authHeader.slice(7);

        // Remove from Redis
        await redis.del(`session:${token}`);

        // Mark session as expired in DB
        await db.query(`
      UPDATE sessions SET expires_at = NOW() WHERE token = $1
    `, [token]);

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /admin/mockLogin (Development only)
 * Create mock admin session for testing
 */
router.post('/admin/mockLogin', async (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'E_NOT_FOUND' });
    }

    try {
        const { role } = req.body;
        const allowedRoles = ['hospital_admin', 'doctor', 'ambulance_partner', 'quickaid_admin'];

        if (!role || !allowedRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                error: 'E_INVALID_ROLE',
                allowed: allowedRoles
            });
        }

        const userId = genId('USR');
        const accessToken = jwt.sign({
            user_id: userId,
            role: role.toLowerCase(),
            type: 'access',
            mock: true
        }, JWT_SECRET, { expiresIn: '1h' });

        await redis.set(`session:${accessToken}`, JSON.stringify({
            user_id: userId,
            role: role.toLowerCase()
        }), 3600);

        res.status(200).json({
            access_token: accessToken,
            token_type: 'Bearer',
            role: role.toLowerCase(),
            expires_in: 3600,
            warning: 'This is a mock token for development only'
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /me
 * Get current user info
 */
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'E_AUTH_REQUIRED' });
        }

        const token = authHeader.slice(7);

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'E_TOKEN_INVALID' });
        }

        // Get user
        const userResult = await db.query(
            'SELECT user_id, phone, name, role, aadhaar_last4, is_verified, created_at FROM users WHERE user_id = $1',
            [decoded.user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'E_USER_NOT_FOUND' });
        }

        res.status(200).json({
            user: userResult.rows[0]
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
