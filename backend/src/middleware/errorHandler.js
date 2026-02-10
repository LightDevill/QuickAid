const logger = require('../config/logger');
const { ApiError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    if (!statusCode && !(err instanceof ApiError)) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    const response = {
        success: false,
        error: {
            code: statusCode,
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    };

    if (statusCode === 500) {
        logger.error(err); // Log full error for 500s
    } else {
        logger.warn(err.message); // Log warning for client errors
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
