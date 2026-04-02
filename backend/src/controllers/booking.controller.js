const BookingService = require('../services/booking.service');
const { v4: uuidv4 } = require('uuid');

const createBooking = async (req, res, next) => {
    try {
        const bookingData = {
            ...req.body,
            user_id: req.user.id,
            idempotency_key: req.headers['idempotency-key'] || uuidv4(),
            qr_token: uuidv4(), // generate token
        };

        const result = await BookingService.createBooking(bookingData);
        res.status(201).json({ success: true, data: result, message: 'Booking created' });
    } catch (error) {
        next(error);
    }
};

const getBooking = async (req, res, next) => {
    try {
        const result = await BookingService.getBooking(req.params.id, req.user);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getMyBookings = async (req, res, next) => {
    try {
        const result = await BookingService.getUserBookings(req.user.id);
        res.json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
};

const getHospitalBookings = async (req, res, next) => {
    try {
        const hospitalId = req.query.hospital_id || req.user.hospital_id;
        const result = await BookingService.getHospitalBookings(hospitalId, req.user);
        res.json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
};

const approveBooking = async (req, res, next) => {
    try {
        const result = await BookingService.approveBooking(req.params.id, req.user);
        res.json({ success: true, data: result, message: 'Booking approved' });
    } catch (error) {
        next(error);
    }
};

const rejectBooking = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const result = await BookingService.rejectBooking(req.params.id, reason, req.user);
        res.json({ success: true, data: result, message: 'Booking rejected' });
    } catch (error) {
        next(error);
    }
};

const cancelBooking = async (req, res, next) => {
    try {
        const result = await BookingService.cancelBooking(req.params.id, req.user.id);
        res.json({ success: true, data: result, message: 'Booking cancelled' });
    } catch (e) {
        next(e);
    }
};

module.exports = {
    createBooking,
    getBooking,
    getMyBookings,
    getHospitalBookings,
    approveBooking,
    rejectBooking,
    cancelBooking,
};
