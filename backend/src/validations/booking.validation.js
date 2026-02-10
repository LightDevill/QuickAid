const Joi = require('joi');

const createBooking = {
    body: Joi.object().keys({
        hospital_id: Joi.string().required(),
        bed_type: Joi.string().required().valid('general', 'icu', 'oxygen', 'ventilator', 'pediatric', 'maternity'),
        patient_name: Joi.string().required().min(2),
        patient_age: Joi.number().integer().min(0).max(150).required(),
        patient_gender: Joi.string().required().valid('male', 'female', 'other'),
        emergency_contact: Joi.string().required().pattern(/^\+91[0-9]{10}$/),
        symptoms: Joi.string().allow('', null),
    }),
};

module.exports = {
    createBooking,
};
