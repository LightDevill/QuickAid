import apiClient from './axios';
import { v4 as uuidv4 } from 'uuid';
import { mockBookings, mockHospitals, mockUser } from './mockData';
import useAuthStore from '../stores/authStore';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const unwrapData = (payload) => payload?.data || payload || {};
const getCurrentUser = () => useAuthStore.getState().user;
const extractBookings = (payload) => {
    const unwrapped = unwrapData(payload);
    if (Array.isArray(unwrapped)) return unwrapped;
    return unwrapped?.bookings || [];
};

const findHospitalMeta = (hospitalId) =>
    mockHospitals.find(
        (hospital) => hospital.hospital_id === hospitalId || hospital.id === hospitalId
    );

const normalizeEmergencyContact = (phone) => {
    if (!phone) return '';

    const trimmed = String(phone).trim();
    if (trimmed === 'N/A') return trimmed;
    if (trimmed.startsWith('+')) return trimmed;

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;

    return trimmed;
};

const buildCreatePayload = (bookingData) => ({
    hospital_id: bookingData.hospital_id,
    bed_type: bookingData.bed_type,
    patient_name: bookingData.patient_name,
    patient_age: bookingData.patient_age ?? bookingData.age,
    patient_gender: bookingData.patient_gender ?? bookingData.gender,
    emergency_contact: normalizeEmergencyContact(bookingData.emergency_contact),
    symptoms: bookingData.symptoms || '',
});

const normalizeBooking = (booking = {}, fallback = {}) => {
    const merged = { ...fallback, ...booking };
    const bookingId = merged.booking_id || merged.id;
    const hospitalId = merged.hospital_id || fallback.hospital_id;
    const hospitalMeta = findHospitalMeta(hospitalId);
    const bedType = merged.bed_type || merged.bed_category || fallback.bed_type || fallback.bed_category;
    const age = merged.age ?? merged.patient_age ?? fallback.age ?? fallback.patient_age;
    const gender = merged.gender ?? merged.patient_gender ?? fallback.gender ?? fallback.patient_gender;
    const createdAt = merged.created_at || fallback.created_at || new Date().toISOString();

    return {
        ...merged,
        id: bookingId,
        booking_id: bookingId,
        hospital_id: hospitalId,
        hospital_name: merged.hospital_name || fallback.hospital_name || hospitalMeta?.name || 'Selected Hospital',
        hospital_address: merged.hospital_address || fallback.hospital_address || hospitalMeta?.address || '',
        hospital_phone: merged.hospital_phone || fallback.hospital_phone || hospitalMeta?.phone || '',
        bed_type: bedType,
        bed_category: bedType,
        age,
        patient_age: merged.patient_age ?? age,
        gender,
        patient_gender: merged.patient_gender ?? gender,
        emergency_contact: normalizeEmergencyContact(
            merged.emergency_contact || fallback.emergency_contact
        ),
        created_at: createdAt,
        updated_at: merged.updated_at || fallback.updated_at || createdAt,
        status: merged.status || fallback.status || 'pending',
        qr_token: merged.qr_token ?? fallback.qr_token ?? null,
        lock_expires_at: merged.lock_expires_at || fallback.lock_expires_at || null,
        rejection_reason: merged.rejection_reason || fallback.rejection_reason || '',
    };
};

export const bookingApi = {
    // Create a new booking with idempotency
    createBooking: async (bookingData) => {
        const requestBooking = buildCreatePayload(bookingData);
        const bookingFallback = normalizeBooking({
            hospital_id: bookingData.hospital_id,
            bed_type: bookingData.bed_type,
            patient_name: bookingData.patient_name,
            age: bookingData.age ?? bookingData.patient_age,
            patient_age: bookingData.patient_age ?? bookingData.age,
            gender: bookingData.gender ?? bookingData.patient_gender,
            patient_gender: bookingData.patient_gender ?? bookingData.gender,
            emergency_contact: requestBooking.emergency_contact,
            symptoms: bookingData.symptoms || '',
        });

        if (MOCK_MODE) {
            console.log('[MOCK] createBooking:', bookingData);
            await delay(800);
            const hospital = findHospitalMeta(requestBooking.hospital_id);

            const newBooking = normalizeBooking({
                booking_id: 'bk_mock_' + Date.now(),
                user_id: mockUser.user_id,
                hospital_name: hospital?.name || 'Selected Hospital',
                hospital_address: hospital?.address || '',
                hospital_phone: hospital?.phone || '',
                ...bookingFallback,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                lock_expires_at: new Date(Date.now() + 90000).toISOString(),
                qr_token: null,
            }, bookingFallback);
            mockBookings.unshift(newBooking); // Add to beginning
            return { booking: newBooking };
        }

        const idempotencyKey = uuidv4();
        const response = await apiClient.post('/v1/bookings', requestBooking, {
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
        });
        const payload = unwrapData(response.data);
        const createdBooking = normalizeBooking(payload?.booking || payload, bookingFallback);
        return { booking: createdBooking };
    },

    // Get booking by ID
    getBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getBooking:', bookingId);
            await delay(400);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (!booking) throw { response: { status: 404, data: { error: 'Booking not found' } } };
            return { booking: normalizeBooking(booking) };
        }
        const response = await apiClient.get(`/v1/bookings/${bookingId}`);
        const payload = unwrapData(response.data);
        return { booking: normalizeBooking(payload?.booking || payload, { booking_id: bookingId }) };
    },

    // Get all bookings for current user
    getMyBookings: async () => {
        if (MOCK_MODE) {
            console.log('[MOCK] getMyBookings');
            await delay(600);
            const currentUserId = getCurrentUser()?.user_id || mockUser.user_id;
            return {
                bookings: mockBookings
                    .filter(b => b.user_id === currentUserId)
                    .map((booking) => normalizeBooking(booking)),
            };
        }
        const response = await apiClient.get('/v1/bookings/my');
        return {
            bookings: extractBookings(response.data).map((booking) => normalizeBooking(booking)),
        };
    },

    // Get bookings for a hospital workflow view
    getHospitalBookings: async (hospitalId) => {
        const activeHospitalId = hospitalId || getCurrentUser()?.hospital_id;

        if (MOCK_MODE) {
            console.log('[MOCK] getHospitalBookings:', activeHospitalId);
            await delay(600);
            const filteredBookings = activeHospitalId
                ? mockBookings.filter((booking) => booking.hospital_id === activeHospitalId)
                : mockBookings;

            return {
                bookings: filteredBookings.map((booking) => normalizeBooking(booking)),
            };
        }

        try {
            const response = await apiClient.get('/v1/bookings/hospital', {
                params: activeHospitalId ? { hospital_id: activeHospitalId } : {},
            });

            return {
                bookings: extractBookings(response.data).map((booking) => normalizeBooking(booking)),
            };
        } catch {
            const ownBookings = await bookingApi.getMyBookings();
            const filteredBookings = activeHospitalId
                ? (ownBookings.bookings || []).filter((booking) => booking.hospital_id === activeHospitalId)
                : ownBookings.bookings || [];

            return {
                bookings: filteredBookings,
            };
        }
    },

    // Approve booking (admin only)
    approveBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] approveBooking:', bookingId);
            await delay(500);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (booking) booking.status = 'approved';
            return { booking: booking ? normalizeBooking(booking) : null };
        }
        const response = await apiClient.post(`/v1/bookings/${bookingId}/approve`);
        const payload = unwrapData(response.data);
        if (payload?.booking || payload?.status) {
            return {
                booking: normalizeBooking(payload.booking || payload, { booking_id: bookingId }),
            };
        }
        return payload;
    },

    // Reject booking (admin only)
    rejectBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] rejectBooking:', bookingId);
            await delay(500);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (booking) booking.status = 'rejected';
            return { booking: booking ? normalizeBooking(booking) : null };
        }
        const response = await apiClient.post(`/v1/bookings/${bookingId}/reject`);
        const payload = unwrapData(response.data);
        if (payload?.booking || payload?.status) {
            return {
                booking: normalizeBooking(payload.booking || payload, { booking_id: bookingId }),
            };
        }
        return payload;
    },

    // Cancel booking (citizen)
    cancelBooking: async (bookingId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] cancelBooking:', bookingId);
            await delay(500);
            const booking = mockBookings.find(b => b.booking_id === bookingId);
            if (booking) booking.status = 'cancelled';
            return { booking: booking ? normalizeBooking(booking) : null };
        }
        const response = await apiClient.post(`/v1/bookings/${bookingId}/cancel`);
        const payload = unwrapData(response.data);
        if (payload?.booking || payload?.status) {
            return {
                booking: normalizeBooking(payload.booking || payload, { booking_id: bookingId }),
            };
        }
        return payload;
    },
};

export default bookingApi;
