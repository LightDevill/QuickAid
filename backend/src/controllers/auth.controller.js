const AuthService = require('../services/auth.service');

const sendOtp = async (req, res, next) => {
    try {
        const { phone } = req.body;
        const result = await AuthService.sendOtp(phone);
        res.json({ success: true, data: result, message: result.message });
    } catch (error) {
        next(error);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        const { phone, otp, request_id, aadhaar_number } = req.body;
        const result = await AuthService.verifyOtp(phone, otp, request_id, aadhaar_number);
        res.json({ success: true, data: result, message: 'Login successful' });
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        const result = await AuthService.refreshToken(refresh_token);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        // Ideally we invalidate refresh token passed in body
        // For now, if we had it, we'd use it. Assuming passed in body or just clearing cookie/header context
        // The spec says Body: { refresh_token } for logout usually or just auth header
        // Let's assume passed in body
        const { refresh_token } = req.body;
        if (refresh_token) {
            await AuthService.logout(refresh_token);
        }
        res.json({ success: true, message: 'Logged out' });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        // user is attached by auth middleware
        res.json({ success: true, data: { user: req.user } });
    } catch (e) {
        next(e);
    }
};

const mockAdminLogin = async (req, res, next) => {
    try {
        const { role } = req.body;
        const result = await AuthService.mockAdminLogin(role);
        res.json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    refreshToken,
    logout,
    getMe,
    mockAdminLogin,
};
