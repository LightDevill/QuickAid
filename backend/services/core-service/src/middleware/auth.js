// JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const redis = require('../../../shared/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'quickaid-dev-secret';

/**
 * Extract and verify JWT from Authorization header
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    // Also check X-Role header for backward compatibility with original monolith
    const headerRole = req.headers['x-role'];

    if (!authHeader && headerRole) {
        // Legacy mode - use X-Role header
        req.user = { role: headerRole.toLowerCase() };
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'E_AUTH_REQUIRED',
            message: 'Authorization header required'
        });
    }

    const token = authHeader.slice(7);

    try {
        // Check Redis cache first
        const cached = await redis.getJSON(`session:${token}`);
        if (cached) {
            req.user = cached;
            return next();
        }

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            user_id: decoded.user_id,
            role: decoded.role,
            phone: decoded.phone
        };

        // Cache for subsequent requests
        await redis.set(`session:${token}`, JSON.stringify(req.user), 300);

        next();
    } catch (err) {
        return res.status(401).json({
            error: 'E_TOKEN_INVALID',
            message: 'Invalid or expired token'
        });
    }
}

/**
 * Require specific roles
 */
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'E_AUTH_REQUIRED' });
        }

        const userRole = req.user.role?.toLowerCase();
        const allowed = allowedRoles.map(r => r.toLowerCase());

        if (!allowed.includes(userRole)) {
            return res.status(403).json({
                error: 'E_FORBIDDEN',
                message: `Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
}

/**
 * Optional auth - populates req.user if token present, but doesn't require it
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const headerRole = req.headers['x-role'];

    if (headerRole) {
        req.user = { role: headerRole.toLowerCase() };
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const cached = await redis.getJSON(`session:${token}`);
            if (cached) {
                req.user = cached;
            } else {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = {
                    user_id: decoded.user_id,
                    role: decoded.role
                };
            }
        } catch (err) {
            // Token invalid, continue without auth
        }
    }

    next();
}

module.exports = { authMiddleware, requireRoles, optionalAuth };
