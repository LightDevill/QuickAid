import apiClient from './axios';
import { mockDashboardStats, mockAnalyticsReport, mockHospitals } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const analyticsApi = {
    // Get dashboard statistics
    getDashboard: async () => {
        if (MOCK_MODE) {
            console.log('[MOCK] getDashboard');
            await delay(500);
            return mockDashboardStats;
        }
        const response = await apiClient.get('/v1/analytics/dashboard');
        return response.data;
    },

    // Get booking reports with date range
    getBookingReport: async (startDate = null, endDate = null, hospitalId = null) => {
        if (MOCK_MODE) {
            console.log('[MOCK] getBookingReport:', { startDate, endDate, hospitalId });
            await delay(800);
            return mockAnalyticsReport;
        }

        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (hospitalId) params.hospital_id = hospitalId;

        const response = await apiClient.get('/v1/analytics/bookings/report', { params });
        return response.data;
    },

    // Get hospital performance metrics
    getHospitalPerformance: async () => {
        if (MOCK_MODE) {
            console.log('[MOCK] getHospitalPerformance');
            await delay(600);
            return {
                hospitals: mockHospitals.map(h => ({
                    id: h.hospital_id,
                    name: h.name,
                    approval_rate: 85 + Math.random() * 10,
                    bed_utilization: 60 + Math.random() * 30,
                    avg_response_time: 15 + Math.random() * 20
                }))
            };
        }
        const response = await apiClient.get('/v1/analytics/hospitals/performance');
        return response.data;
    },
};

export default analyticsApi;
