const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
});

// Stricter limiter for sensitive endpoints (OTP)
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per minute
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts, please try again later.' } }
});

module.exports = {
    apiLimiter,
    authLimiter,
};
