import apiClient from './axios';
import { mockUser, mockHospitalAdmin, mockQuickAidAdmin } from './mockData';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const authApi = {
    // Send OTP to phone number
    sendOtp: async (phone) => {
        if (MOCK_MODE) {
            console.log('[MOCK] sendOtp:', phone);
            await delay(500);
            return {
                success: true,
                data: {
                    request_id: 'req_mock_' + Date.now(),
                    message: 'OTP sent successfully',
                    otp: '1234',
                },
                // Also at top level for backward compatibility
                request_id: 'req_mock_' + Date.now(),
                otp: '1234',
            };
        }

        const response = await apiClient.post('/v1/identity/otp/send', { phone });
        console.log('[API] sendOtp raw response:', response.data);

        // Normalize: return the inner data if wrapped in { success, data }
        const result = response.data?.data || response.data;
        return result;
    },

    // Verify OTP and get JWT tokens
    verifyOtp: async (requestId, otp, phone, aadhaarNumber = null) => {
        if (MOCK_MODE) {
            console.log('[MOCK] verifyOtp:', { requestId, otp, phone });
            await delay(800);

            if (otp !== '1234') {
                const error = new Error('Invalid OTP');
                error.response = { data: { error: { message: 'Invalid OTP' } } };
                throw error;
            }

            let user = mockUser;
            if (phone.includes('11')) user = mockHospitalAdmin;
            if (phone.includes('12')) user = mockQuickAidAdmin;

            return {
                access_token: 'mock_access_token_' + Date.now(),
                refresh_token: 'mock_refresh_token_' + Date.now(),
                user: user,
            };
        }

        const payload = {
            request_id: requestId,
            otp,
            phone,
        };

        if (aadhaarNumber) {
            payload.aadhaar_number = aadhaarNumber;
        }

        console.log('[API] verifyOtp payload:', payload);

        const response = await apiClient.post('/v1/identity/otp/verify', payload);
        console.log('[API] verifyOtp raw response:', response.data);

        // Normalize: return the inner data if wrapped in { success, data }
        const result = response.data?.data || response.data;
        return result;
    },

    // Refresh access token
    refreshToken: async (refreshToken) => {
        if (MOCK_MODE) {
            console.log('[MOCK] refreshToken');
            await delay(300);
            return { access_token: 'mock_new_access_token_' + Date.now() };
        }

        const response = await apiClient.post('/v1/auth/refresh', {
            refresh_token: refreshToken,
        });

        const result = response.data?.data || response.data;
        return result;
    },

    // Logout user
    logout: async () => {
        if (MOCK_MODE) {
            console.log('[MOCK] logout');
            await delay(200);
            return { message: 'Logged out successfully' };
        }

        try {
            await apiClient.post('/v1/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Get current user info
    getMe: async () => {
        if (MOCK_MODE) {
            console.log('[MOCK] getMe');
            await delay(300);
            return mockUser;
        }

        const response = await apiClient.get('/v1/auth/me');
        const result = response.data?.data || response.data;
        return result?.user || result;
    },

    // Mock admin login (dev only)
    mockAdminLogin: async (role) => {
        if (MOCK_MODE) {
            console.log('[MOCK] mockAdminLogin:', role);
            await delay(500);

            let user = mockUser;
            if (role === 'hospital_admin') user = mockHospitalAdmin;
            if (role === 'quickaid_admin') user = mockQuickAidAdmin;

            return {
                access_token: 'mock_admin_access_token_' + Date.now(),
                refresh_token: 'mock_admin_refresh_token_' + Date.now(),
                user,
            };
        }

        const response = await apiClient.post('/v1/admin/mockLogin', { role });
        const result = response.data?.data || response.data;
        return result;
    },
};

export default authApi;