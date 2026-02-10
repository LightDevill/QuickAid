const Joi = require('joi');

const sos = {
    body: Joi.object().keys({
        lat: Joi.number().required().min(-90).max(90),
        lng: Joi.number().required().min(-180).max(180),
        severity: Joi.string().required().valid('critical', 'serious', 'moderate'),
        symptoms: Joi.array().items(Joi.string()),
    }),
};

const doctorRequest = {
    body: Joi.object().keys({
        emergency_id: Joi.string().required().uuid(),
        hospital_id: Joi.string().required(),
        context: Joi.string().allow(''),
        preferred_specialty: Joi.string().allow(null),
    })
}

module.exports = {
    sos,
    doctorRequest,
};
