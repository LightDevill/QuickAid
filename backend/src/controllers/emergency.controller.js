const EmergencyService = require('../services/emergency.service');

const createSos = async (req, res, next) => {
    try {
        const sosData = {
            ...req.body,
            user_id: req.user.id,
        };
        const result = await EmergencyService.createSos(sosData);
        res.status(201).json({ success: true, data: result, message: 'SOS created, help is on the way' });
    } catch (error) {
        next(error);
    }
};

const requestDoctor = async (req, res, next) => {
    try {
        const result = await EmergencyService.requestDoctor(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
};

const sendAmbulanceAlert = async (req, res, next) => {
    try {
        const result = await EmergencyService.sendAmbulanceAlert(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
};

module.exports = {
    createSos,
    requestDoctor,
    sendAmbulanceAlert,
};
