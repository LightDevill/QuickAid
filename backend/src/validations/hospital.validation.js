const Joi = require('joi');

const search = {
    query: Joi.object().keys({
        lat: Joi.number().required().min(-90).max(90),
        lng: Joi.number().required().min(-180).max(180),
        bed_type: Joi.string().valid('general', 'icu', 'oxygen', 'ventilator', 'pediatric', 'maternity'),
        radius_km: Joi.number().min(1).max(100).default(10),
    }),
};

const updateBeds = {
    body: Joi.object().keys({
        hospital_id: Joi.string().required(),
        bed_type: Joi.string().required().valid('general', 'icu', 'oxygen', 'ventilator', 'pediatric', 'maternity'),
        available: Joi.number().integer().min(0).required(),
        total: Joi.number().integer().min(0).required(),
    }),
};

module.exports = {
    search,
    updateBeds,
};
