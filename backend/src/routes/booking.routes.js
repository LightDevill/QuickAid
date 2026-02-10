const express = require('express');
const validate = require('../middleware/validator');
const bookingValidation = require('../validations/booking.validation');
const bookingController = require('../controllers/booking.controller');
const { verifyToken, authorize } = require('../middleware/auth');
const checkIdempotency = require('../middleware/idempotency');

const router = express.Router();

router.post(
    '/bookings',
    verifyToken,
    checkIdempotency,
    validate(bookingValidation.createBooking),
    bookingController.createBooking
);

router.get('/bookings/my', verifyToken, bookingController.getMyBookings);
router.get('/bookings/:id', verifyToken, bookingController.getBooking);

router.post(
    '/bookings/:id/approve',
    verifyToken,
    authorize(['hospital_admin', 'quickaid_admin']),
    bookingController.approveBooking
);

router.post(
    '/bookings/:id/reject',
    verifyToken,
    authorize(['hospital_admin', 'quickaid_admin']),
    bookingController.rejectBooking
);

router.post('/bookings/:id/cancel', verifyToken, bookingController.cancelBooking);

module.exports = router;
