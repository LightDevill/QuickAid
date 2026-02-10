const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const UserModel = require('../models/user.model');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.accessSecret);
        req.user = decoded; // { id, role, phone, hospital_id }
        next();
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired token');
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError();
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            throw new ForbiddenError('You do not have permission to perform this action');
        }

        next();
    };
};

module.exports = {
    verifyToken,
    authorize,
};
