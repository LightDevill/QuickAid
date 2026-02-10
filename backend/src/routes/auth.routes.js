const express = require('express');
const validate = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/identity/otp/send', authLimiter, validate(authValidation.sendOtp), authController.sendOtp);
router.post('/identity/otp/verify', authLimiter, validate(authValidation.verifyOtp), authController.verifyOtp);
router.post('/auth/refresh', validate(authValidation.refreshToken), authController.refreshToken);
router.post('/auth/logout', verifyToken, authController.logout);
router.get('/auth/me', verifyToken, authController.getMe);

// Dev only
if (process.env.NODE_ENV === 'development') {
    router.post('/admin/mockLogin', authController.mockAdminLogin);
}

module.exports = router;
