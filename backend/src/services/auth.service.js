const UserModel = require('../models/user.model');
const { generateOtp, hashOtp, checkOtp, generateTokens } = require('../utils/helpers');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

class AuthService {
    // Send OTP
    static async sendOtp(phone) {
        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        const requestId = uuidv4();

        // Save request
        await UserModel.createOtpRequest(phone, otpHash, requestId);

        // In production, integrate SMS gateway here
        // await sendSms(phone, `Your QUICKAID OTP is ${otp}`);

        return { request_id: requestId, message: 'OTP sent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
    }

    // Verify OTP & Login/Register
    static async verifyOtp(phone, otp, requestId, aadhaarNumber) {
        const request = await UserModel.getOtpRequest(requestId);

        if (!request) {
            throw new BadRequestError('Invalid request ID');
        }

        if (request.phone !== phone) {
            throw new BadRequestError('Phone number does not match request');
        }

        if (request.verified) {
            throw new BadRequestError('OTP already verified');
        }

        if (new Date() > new Date(request.expires_at)) {
            throw new BadRequestError('OTP expired');
        }

        if (!checkOtp(otp, request.otp_hash)) {
            throw new BadRequestError('Invalid OTP');
        }

        // Mark verified
        await UserModel.verifyOtpRequest(requestId);

        // Find or create user
        let user = await UserModel.findByPhone(phone);

        if (!user) {
            // Create new citizen
            user = await UserModel.create({
                phone,
                name: 'New User', // Placeholder, update in profile
                role: 'citizen',
                aadhaar_hash: aadhaarNumber ? hashOtp(aadhaarNumber) : null
            });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Save session
        await UserModel.createSession(user.id, tokens.refreshToken);

        return { user, ...tokens };
    }

    // Refresh Token
    static async refreshToken(token) {
        const session = await UserModel.findSession(token);
        if (!session) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const user = await UserModel.findById(session.user_id);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        const tokens = generateTokens(user);

        // Rotate refresh token (invalidate old, create new)
        await UserModel.invalidateSession(token);
        await UserModel.createSession(user.id, tokens.refreshToken);

        return tokens;
    }

    // Logout
    static async logout(token) {
        await UserModel.invalidateSession(token);
    }

    // Mock Admin Login
    static async mockAdminLogin(role) {
        // Find first user with that role
        // This is purely for dev ease
        const { rows } = await require('../config/database').query('SELECT * FROM users WHERE role = $1 LIMIT 1', [role]);
        const user = rows[0];

        if (!user) throw new BadRequestError(`No user with role ${role} found. Run seed?`);

        const tokens = generateTokens(user);
        await UserModel.createSession(user.id, tokens.refreshToken);

        return { user, ...tokens };
    }
}

module.exports = AuthService;
