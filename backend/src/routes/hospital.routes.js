const express = require('express');
const validate = require('../middleware/validator');
const hospitalValidation = require('../validations/hospital.validation');
const hospitalController = require('../controllers/hospital.controller');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/hospitals/search', validate(hospitalValidation.search), hospitalController.searchHospitals);
router.get('/hospitals/:id', hospitalController.getHospital);
router.get('/doctors/available', hospitalController.getAvailableDoctors);
router.get('/doctors/:id', hospitalController.getDoctor);

// Admin only
router.post(
    '/hospital/updateBeds',
    verifyToken,
    authorize(['hospital_admin', 'quickaid_admin']),
    validate(hospitalValidation.updateBeds),
    hospitalController.updateBeds
);

module.exports = router;
