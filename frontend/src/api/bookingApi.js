import apiClient from './axios';
import { v4 as uuidv4 } from 'uuid';
import { mockBookings } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const bookingApi = {
    // Create a new booking with idempotency
    createBooking: async (bookingData) => {
        if (MOCK_MODE) {
            console.log('[MOCK] createBooking:', bookingData);
            await delay(800);

            const newBooking = {
                booking_id: 'bk_mock_' + Date.now(),
                ...bookingData,
                status: 'pending',
                created_at: new Date().toISOString(),
                lock_expires_at: new Date(Date.now() + 90000).toISOString(),
                qr_token: 'mock_qr_' + Date.now(),
            };
            mockBookings.unshift(newBooking); // Add to beginning
            return { booking: newBooking };
        }

        const idempotencyKey = uuidv4();
        const response = await apiClient.post('/v1/bookings', bookingData, {
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
        });
        return response.data;
    },

    // Get booking by ID
    getBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getBooking:', bookingId);
            await delay(400);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (!booking) throw { response: { status: 404, data: { error: 'Booking not found' } } };
            return { booking };
        }
        const response = await apiClient.get(`/v1/bookings/${bookingId}`);
        return response.data;
    },

    // Get all bookings for current user
    getMyBookings: async () => {
        if (MOCK_MODE) {
            console.log('[MOCK] getMyBookings');
            await delay(600);
            // Return all bookings for the mock citizen
            return { bookings: mockBookings.filter(b => b.user_id === 'usr_citizen_001') };
        }
        const response = await apiClient.get('/v1/bookings/my');
        return response.data;
    },

    // Approve booking (admin only)
    approveBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] approveBooking:', bookingId);
            await delay(500);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (booking) booking.status = 'approved';
            return { booking };
        }
        const response = await apiClient.post(`/v1/bookings/${bookingId}/approve`);
        return response.data;
    },

    // Reject booking (admin only)
    rejectBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] rejectBooking:', bookingId);
            await delay(500);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (booking) booking.status = 'rejected';
            return { booking };
        }
        const response = await apiClient.post(`/v1/bookings/${bookingId}/reject`);
        return response.data;
    },

    // Cancel booking (citizen)
    cancelBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] cancelBooking:', bookingId);
            await delay(500);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (booking) booking.status = 'cancelled';
            return { booking };
        }
        const response = await apiClient.post(`/v1/bookings/${bookingId}/cancel`);
        return response.data;
    },
};

export default bookingApi;
