const BookingModel = require('../models/booking.model');
const { BadRequestError } = require('../utils/errors');

const checkIdempotency = async (req, res, next) => {
    const key = req.headers['idempotency-key'];
    if (!key) {
        // For some operations, key might be required
        if (req.method === 'POST' && req.path.includes('/bookings')) {
            return next(new BadRequestError('Idempotency-Key header is required'));
        }
        return next();
    }

    // Check if key exists in bookings (or a generic idempotency table if we had one)
    // For MVP, checking if booking with this key exists
    const existingBooking = await BookingModel.findByIdempotencyKey(key);

    if (existingBooking) {
        return res.json({
            success: true,
            data: existingBooking,
            message: 'Duplicate request detected, returning existing booking.'
        });
    }

    next();
};

module.exports = checkIdempotency;
