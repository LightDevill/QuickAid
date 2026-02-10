// Winston logger configuration
const winston = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
        log += `\n${stack}`;
    }
    return log;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
    ),
    defaultMeta: {
        service: process.env.SERVICE_NAME || 'quickaid',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: []
});

// Add transports based on environment
if (process.env.NODE_ENV === 'production') {
    // Production: JSON format for log aggregation
    logger.add(new winston.transports.Console({
        format: combine(json())
    }));

    // Add file transport for production
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(json()),
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        format: combine(json()),
        maxsize: 5242880,
        maxFiles: 5
    }));
} else {
    // Development: colorized console output
    logger.add(new winston.transports.Console({
        format: combine(
            colorize({ all: true }),
            devFormat
        )
    }));
}

/**
 * Create a child logger with additional context
 * @param {object} meta - Additional metadata
 * @returns {winston.Logger}
 */
function child(meta) {
    return logger.child(meta);
}

/**
 * Log an HTTP request
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {number} duration - Request duration in ms
 */
function logRequest(req, res, duration) {
    const { method, url, ip } = req;
    const { statusCode } = res;

    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, `${method} ${url} ${statusCode}`, {
        method,
        url,
        statusCode,
        duration,
        ip,
        userAgent: req.headers['user-agent']
    });
}

/**
 * Log an audit event
 * @param {string} action - Action performed
 * @param {object} details - Event details
 */
function audit(action, details) {
    logger.info(`AUDIT: ${action}`, {
        type: 'audit',
        action,
        ...details
    });
}

/**
 * Log a security event
 * @param {string} event - Security event type
 * @param {object} details - Event details
 */
function security(event, details) {
    logger.warn(`SECURITY: ${event}`, {
        type: 'security',
        event,
        ...details
    });
}

module.exports = {
    logger,
    child,
    logRequest,
    audit,
    security,
    // Expose standard log methods
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    debug: logger.debug.bind(logger)
};
