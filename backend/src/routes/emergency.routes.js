const express = require('express');
const validate = require('../middleware/validator');
const emergencyValidation = require('../validations/emergency.validation');
const emergencyController = require('../controllers/emergency.controller');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/emergency/sos', verifyToken, validate(emergencyValidation.sos), emergencyController.createSos);
router.post('/doctor/request', verifyToken, validate(emergencyValidation.doctorRequest), emergencyController.requestDoctor);
router.post(
    '/alerts/ambulance',
    verifyToken,
    authorize(['hospital_admin', 'ambulance_partner']),
    emergencyController.sendAmbulanceAlert
);

module.exports = router;
