const { pool, query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserModel {
    // Create a new user
    static async create(userData) {
        const { phone, name, role, hospital_id } = userData;
        const text = `
      INSERT INTO users (phone, name, role, hospital_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
        const values = [phone, name, role || 'citizen', hospital_id];
        const { rows } = await query(text, values);
        return rows[0];
    }

    // Find user by phone
    static async findByPhone(phone) {
        const text = 'SELECT * FROM users WHERE phone = $1';
        const { rows } = await query(text, [phone]);
        return rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const text = 'SELECT * FROM users WHERE id = $1';
        const { rows } = await query(text, [id]);
        return rows[0];
    }

    // Update user profile
    static async update(id, updates) {
        const { name, email } = updates;
        const text = `
      UPDATE users
      SET name = COALESCE($2, name),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
        const { rows } = await query(text, [id, name]);
        return rows[0];
    }

    // Create OTP request
    static async createOtpRequest(phone, otpHash, requestId) {
        const text = `
        INSERT INTO otp_requests (phone, otp_hash, request_id, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '3 minutes')
        RETURNING *;
      `;
        const { rows } = await query(text, [phone, otpHash, requestId]);
        return rows[0];
    }

    // Get OTP request
    static async getOtpRequest(requestId) {
        const text = 'SELECT * FROM otp_requests WHERE request_id = $1';
        const { rows } = await query(text, [requestId]);
        return rows[0];
    }

    // Verify OTP request
    static async verifyOtpRequest(requestId) {
        const text = `
        UPDATE otp_requests
        SET verified = TRUE
        WHERE request_id = $1
        RETURNING *;
      `;
        const { rows } = await query(text, [requestId]);
        return rows[0];
    }

    // Add session
    static async createSession(userId, refreshToken) {
        const text = `
        INSERT INTO sessions (user_id, refresh_token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')
        RETURNING *;
      `;
        const { rows } = await query(text, [userId, refreshToken]);
        return rows[0];
    }

    // Find session by refresh token
    static async findSession(refreshToken) {
        const text = 'SELECT * FROM sessions WHERE refresh_token = $1 AND is_active = TRUE AND expires_at > NOW()';
        const { rows } = await query(text, [refreshToken]);
        return rows[0];
    }

    // Invalidate session
    static async invalidateSession(refreshToken) {
        const text = 'UPDATE sessions SET is_active = FALSE WHERE refresh_token = $1';
        await query(text, [refreshToken]);
    }
}

module.exports = UserModel;
