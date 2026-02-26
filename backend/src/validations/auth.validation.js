const Joi = require('joi');

const sendOtp = {
    body: Joi.object().keys({
        phone: Joi.string().required().pattern(/^\+91[0-9]{10}$/),
    }),
};

const verifyOtp = {
    body: Joi.object().keys({
        phone: Joi.string().required().pattern(/^\+91[0-9]{10}$/),
        otp: Joi.string().required().length(6),
        request_id: Joi.string().required().uuid(),
        aadhaar_number: Joi.string().allow(null, ''),
    }),
};

const refreshToken = {
    body: Joi.object().keys({
        refresh_token: Joi.string().required(),
    }),
};

module.exports = {
    sendOtp,
    verifyOtp,
    refreshToken,
};
