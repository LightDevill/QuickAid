const BookingModel = require('../models/booking.model');
const { BadRequestError, ForbiddenError } = require('../utils/errors'); // Assuming ForbiddenError is defined in utils/errors.js

class BookingService {
    // Create
    static async createBooking(data) {
        return await BookingModel.create(data);
    }

    // Get
    static async getBooking(id, user) {
        const booking = await BookingModel.findById(id);
        if (!booking) throw new BadRequestError('Booking not found');

        // Access control
        if (user.role === 'citizen' && booking.user_id !== user.id) {
            throw new BadRequestError('Unauthorized access to booking');
        }

        // Hospital admins can only see their hospital's bookings
        if (['hospital_admin', 'doctor'].includes(user.role) && booking.hospital_id !== user.hospital_id) {
            throw new BadRequestError('Unauthorized access to booking');
        }

        return booking;
    }

    // Get My Bookings
    static async getUserBookings(userId) {
        return await BookingModel.findByUserId(userId);
    }

    // Approve
    static async approveBooking(id, adminUser) {
        const booking = await BookingModel.findById(id);
        if (!booking) throw new BadRequestError('Booking not found');

        // Check if admin belongs to hospital
        if (adminUser.role !== 'quickaid_admin' && booking.hospital_id !== adminUser.hospital_id) {
            throw new ForbiddenError('Unauthorized to approve this booking');
        }

        return await BookingModel.approve(id);
    }

    // Reject
    static async rejectBooking(id, reason, adminUser) {
        const booking = await BookingModel.findById(id);
        if (!booking) throw new BadRequestError('Booking not found');

        if (adminUser.role !== 'quickaid_admin' && booking.hospital_id !== adminUser.hospital_id) {
            throw new ForbiddenError('Unauthorized to reject this booking');
        }

        return await BookingModel.reject(id, reason);
    }

    // Cancel
    static async cancelBooking(id, userId) {
        // User can cancel their own pending booking
        const booking = await BookingModel.findById(id);
        if (!booking) throw new BadRequestError('Booking not found');

        if (booking.user_id !== userId) throw new ForbiddenError('Unauthorized');

        if (booking.status !== 'pending') throw new BadRequestError('Cannot cancel processed booking');

        return await BookingModel.reject(id, 'Cancelled by user'); // Reuse reject logic to free bed
    }
}

module.exports = BookingService;
