import apiClient from './axios';
import { mockEmergency } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const emergencyApi = {
    // Create emergency SOS case
    createSOS: async (data) => {
        if (MOCK_MODE) {
            console.log('[MOCK] createSOS:', data);
            await delay(1000);
            return {
                sos_id: mockEmergency.emergency_id,
                matched_hospitals: mockEmergency.matched_hospitals,
                nearby_ambulances: mockEmergency.nearby_ambulances,
            };
        }
        const response = await apiClient.post('/v1/emergency/sos', data);
        return response.data;
    },

    // Request doctor assignment
    requestDoctor: async (emergencyCaseId, context = '', preferredSpecialty = null) => {
        if (MOCK_MODE) {
            console.log('[MOCK] requestDoctor:', { emergencyCaseId, context });
            await delay(600);
            return {
                doctor_request: {
                    id: 'req_doc_' + Date.now(),
                    status: 'assigned',
                    doctor_name: 'Dr. Mockingjay',
                    specialty: preferredSpecialty || 'Emergency Medicine',
                }
            };
        }

        const payload = {
            emergency_case_id: emergencyCaseId,
            context,
        };

        if (preferredSpecialty) {
            payload.preferred_specialty = preferredSpecialty;
        }

        const response = await apiClient.post('/v1/doctor/request', payload);
        return response.data;
    },

    // Send ambulance alert (admin/partner only)
    sendAmbulanceAlert: async (alertData) => {
        if (MOCK_MODE) {
            console.log('[MOCK] sendAmbulanceAlert:', alertData);
            await delay(400);
            return {
                alert_id: 'amb_alert_' + Date.now(),
                message: 'Ambulance dispatched',
                status: 'dispatched'
            };
        }
        const response = await apiClient.post('/v1/alerts/ambulance', alertData);
        return response.data;
    },
};

export default emergencyApi;
