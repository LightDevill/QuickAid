import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const REFRESH_TIMEOUT_MS = 10000;

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 and auto-refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;

                if (!refreshToken) {
                    // No refresh token, logout
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Try to refresh the token
                const response = await axios.post(
                    `${API_BASE_URL}/v1/auth/refresh`,
                    {
                        refresh_token: refreshToken,
                    },
                    {
                        timeout: REFRESH_TIMEOUT_MS,
                    }
                );

                const refreshPayload = response.data?.data || response.data || {};
                const access_token = refreshPayload.access_token || refreshPayload.accessToken;

                if (!access_token) {
                    throw new Error('Refresh token response did not include a new access token');
                }

                // Update token in store
                useAuthStore.getState().refreshAccessToken(access_token);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                useAuthStore.getState().logout();
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle network errors
        if (!error.response) {
            toast.error('Network error. Please check your connection.');
        } else if (error.response.status === 429) {
            toast.error('Too many requests. Please try again later.');
        } else if (error.response.status >= 500) {
            toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
