import apiClient from './axios';
import { mockHospitals } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const hospitalApi = {
    // Search hospitals with filters
    searchHospitals: async (lat, lng, bedType = 'general', radiusKm = 10) => {
        if (MOCK_MODE) {
            console.log('[MOCK] searchHospitals:', { lat, lng, bedType, radiusKm });
            await delay(600);
            return {
                hospitals: mockHospitals.filter(h => h.distance_km <= radiusKm),
                total: mockHospitals.length,
            };
        }

        const response = await apiClient.get('/v1/hospitals/search', {
            params: {
                lat,
                lng,
                bed_type: bedType,
                radius_km: radiusKm,
            },
        });

        console.log('[API] searchHospitals raw:', response.data);

        // Unwrap: { success, data: { hospitals, total } }
        const result = response.data?.data || response.data;
        return result;
    },

    // Get hospital details by ID
    getHospital: async (hospitalId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getHospital:', hospitalId);
            await delay(300);
            const hospital = mockHospitals.find(h => h.hospital_id === hospitalId || h.id === hospitalId);
            if (!hospital) throw { response: { status: 404, data: { error: 'Hospital not found' } } };
            return { hospital };
        }

        const response = await apiClient.get(`/v1/hospitals/${hospitalId}`);
        console.log('[API] getHospital raw:', response.data);

        const result = response.data?.data || response.data;
        return result;
    },

    // Update bed inventory (admin only)
    updateBeds: async (hospitalId, bedType, available, total) => {
        if (MOCK_MODE) {
            console.log('[MOCK] updateBeds:', { hospitalId, bedType, available, total });
            await delay(400);
            return { message: 'Beds updated successfully' };
        }

        const response = await apiClient.post('/v1/hospital/updateBeds', {
            hospital_id: hospitalId,
            bed_type: bedType,
            available,
            total,
        });

        const result = response.data?.data || response.data;
        return result;
    },

    // Get available doctors
    getAvailableDoctors: async (hospitalId = null, specialty = null) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getAvailableDoctors:', { hospitalId, specialty });
            await delay(400);
            let doctors = [];
            mockHospitals.forEach(h => {
                if (!hospitalId || h.hospital_id === hospitalId || h.id === hospitalId) {
                    if (h.doctors) {
                        h.doctors.forEach(d => {
                            if (!specialty || d.specialty === specialty) {
                                doctors.push({ ...d, hospital_name: h.name });
                            }
                        });
                    }
                }
            });
            return { doctors };
        }

        const params = {};
        if (hospitalId) params.hospital_id = hospitalId;
        if (specialty) params.specialty = specialty;

        const response = await apiClient.get('/v1/doctors/available', { params });
        console.log('[API] getAvailableDoctors raw:', response.data);

        const result = response.data?.data || response.data;
        return result;
    },

    // Get doctor details
    getDoctor: async (doctorId) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getDoctor:', doctorId);
            await delay(200);
            for (const h of mockHospitals) {
                if (h.doctors) {
                    const doc = h.doctors.find(d => d.id === doctorId);
                    if (doc) return { doctor: { ...doc, hospital_name: h.name } };
                }
            }
            throw { response: { status: 404, data: { error: 'Doctor not found' } } };
        }

        const response = await apiClient.get(`/v1/doctors/${doctorId}`);
        console.log('[API] getDoctor raw:', response.data);

        const result = response.data?.data || response.data;
        return result;
    },
};

export default hospitalApi;