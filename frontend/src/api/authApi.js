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
            const dynamicOtp = Math.floor(100000 + Math.random() * 900000).toString();
            console.log('[MOCK] Generated OTP:', dynamicOtp);
            return {
                success: true,
                data: {
                    request_id: 'req_mock_' + Date.now(),
                    message: 'OTP sent successfully',
                    otp: dynamicOtp,
                },
                // Also at top level for backward compatibility
                request_id: 'req_mock_' + Date.now(),
                otp: dynamicOtp,
            };
        }

        const response = await apiClient.post('/v1/identity/otp/send', { phone });
        console.log('[API] sendOtp raw response:', response.data);

        // Normalize: return the inner data if wrapped in { success, data }
        const result = response.data?.data || response.data;
        return result;
    },

    // Verify OTP and get JWT tokens
    verifyOtp: async (requestId, otp, phone, aadhaarNumber = null, name = null) => {
        if (MOCK_MODE) {
            console.log('[MOCK] verifyOtp:', { requestId, otp, phone, name });
            await delay(800);

            // In mock mode, we just accept an OTP correctly formatted, or allow specific testing logic if needed.
            // But since the frontend now passes real generated OTP back, we can just allow any 6-digit number in MOCK_MODE.
            if (!/^\d{6}$/.test(otp)) {
                const error = new Error('Invalid OTP');
                error.response = { data: { error: { message: 'Invalid OTP' } } };
                throw error;
            }

            let user = { ...mockUser, name: name || mockUser.name };
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

        if (name) {
            payload.name = name;
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
