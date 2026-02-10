const HospitalService = require('../services/hospital.service');

const searchHospitals = async (req, res, next) => {
    try {
        const result = await HospitalService.searchHospitals(req.query);
        res.json({ success: true, data: { hospitals: result, total: result.length } });
    } catch (error) {
        next(error);
    }
};

const getHospital = async (req, res, next) => {
    try {
        const result = await HospitalService.getHospital(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, error: { message: 'Hospital not found' } });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateBeds = async (req, res, next) => {
    try {
        const { hospital_id, bed_type, available, total } = req.body;
        // Basic permissions check - only admin of that hospital or super admin
        // user is in req.user
        if (req.user.role !== 'quickaid_admin' &&
            (req.user.role !== 'hospital_admin' || req.user.hospital_id !== hospital_id)) {
            return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
        }

        const result = await HospitalService.updateBeds(hospital_id, req.body);
        res.json({ success: true, data: result, message: 'Beds updated' });
    } catch (error) {
        next(error);
    }
};

const getAvailableDoctors = async (req, res, next) => {
    try {
        const { hospital_id, specialty } = req.query;
        const result = await HospitalService.getAvailableDoctors(hospital_id, specialty);
        res.json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
}

const getDoctor = async (req, res, next) => {
    try {
        const result = await HospitalService.getDoctor(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, error: { message: 'Doctor not found' } });
        }
        res.json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
};

module.exports = {
    searchHospitals,
    getHospital,
    updateBeds,
    getAvailableDoctors,
    getDoctor,
};
