const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateOtp = (length = 6) => {
    // Generate random numeric OTP
    // Development is dynamic too now
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEVELOPMENT] Generated OTP: ${otp}`);
    return otp;
};

const hashOtp = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

const checkOtp = (otp, hash) => {
    return hashOtp(otp) === hash;
};

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, role: user.role, phone: user.phone, hospital_id: user.hospital_id },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiry }
    );

    return { accessToken, refreshToken };
};

// Haversine formula for distance between two points in km
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = x => x * Math.PI / 180;
    const R = 6371; // Earth radius km

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

module.exports = {
    generateOtp,
    hashOtp,
    checkOtp,
    generateTokens,
    calculateDistance,
};
