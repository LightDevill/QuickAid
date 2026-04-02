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
    static async verifyOtp(phone, otp, requestId, aadhaarNumber, name) {
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
                name: name || 'New User', // Use provided name or placeholder
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
        const normalizedRole = String(role || '').toLowerCase().trim().replace(/[-\s]/g, '_');
        const allowedRoles = ['quickaid_admin', 'hospital_admin', 'doctor', 'ambulance_partner', 'citizen'];
        const defaultHospitalId = 'hosp_lilavati_001';

        if (!allowedRoles.includes(normalizedRole)) {
            throw new BadRequestError(`Invalid role "${role}"`);
        }

        // Find first user with that role. If missing in development, create one automatically.
        const db = require('../config/database');
        const { rows } = await db.query('SELECT * FROM users WHERE role = $1 LIMIT 1', [normalizedRole]);
        let user = rows[0];

        if (!user) {
            if (process.env.NODE_ENV !== 'development') {
                throw new BadRequestError(`No user with role ${normalizedRole} found`);
            }

            const phoneByRole = {
                quickaid_admin: '+919900000001',
                hospital_admin: '+919900000002',
                doctor: '+919900000003',
                ambulance_partner: '+919900000004',
                citizen: '+919900000005',
            };

            const created = await UserModel.create({
                phone: phoneByRole[normalizedRole] || '+919900000099',
                name: `Dev ${normalizedRole.replace('_', ' ')}`,
                role: normalizedRole,
                hospital_id: normalizedRole === 'hospital_admin' ? defaultHospitalId : null,
                aadhaar_hash: null,
            });
            user = created;
        }

        // Ensure dev hospital admins are linked to a hospital so their dashboard can load.
        if (
            process.env.NODE_ENV === 'development' &&
            normalizedRole === 'hospital_admin' &&
            !user.hospital_id
        ) {
            const updated = await db.query(
                'UPDATE users SET hospital_id = $1 WHERE id = $2 RETURNING *',
                [defaultHospitalId, user.id]
            );
            user = updated.rows[0] || { ...user, hospital_id: defaultHospitalId };
        }

        const tokens = generateTokens(user);
        await UserModel.createSession(user.id, tokens.refreshToken);

        return { user, ...tokens };
    }
}

module.exports = AuthService;
