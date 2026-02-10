const { query, pool } = require('../config/database');

class BookingModel {
    // Create Booking with Transaction (Lock Bed)
    static async create(data) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Check availability and lock bed
            const lockQuery = `
            UPDATE bed_categories
            SET available = available - 1,
                locked = locked + 1
            WHERE hospital_id = $1 AND bed_type = $2 AND available > 0
            RETURNING *;
        `;
            const { rows: bedRows } = await client.query(lockQuery, [data.hospital_id, data.bed_type]);

            if (bedRows.length === 0) {
                throw new Error('No beds available');
            }

            // 2. Insert booking
            const insertQuery = `
            INSERT INTO bookings (
                user_id, hospital_id, bed_type, status, 
                patient_name, patient_age, patient_gender, 
                emergency_contact, symptoms, 
                qr_token, lock_expires_at, idempotency_key
            )
            VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '90 seconds', $10)
            RETURNING *;
        `;
            const values = [
                data.user_id, data.hospital_id, data.bed_type,
                data.patient_name, data.patient_age, data.patient_gender,
                data.emergency_contact, data.symptoms,
                data.qr_token, data.idempotency_key
            ];

            const { rows: bookingRows } = await client.query(insertQuery, values);

            await client.query('COMMIT');
            return bookingRows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Find booking by ID
    static async findById(id) {
        const text = 'SELECT * FROM bookings WHERE id = $1';
        const { rows } = await query(text, [id]);
        return rows[0];
    }

    // Find all bookings for user
    static async findByUserId(userId) {
        const text = 'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC';
        const { rows } = await query(text, [userId]);
        return rows;
    }

    // Check idempotency
    static async findByIdempotencyKey(key) {
        const text = 'SELECT * FROM bookings WHERE idempotency_key = $1';
        const { rows } = await query(text, [key]);
        return rows[0];
    }

    // Approve Booking
    static async approve(id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get booking to know hospital/bed_type
            const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id]);
            const booking = bookingRes.rows[0];

            if (!booking || booking.status !== 'pending') {
                throw new Error('Booking not found or not pending');
            }

            // Move locked -> reserved
            await client.query(`
              UPDATE bed_categories
              SET locked = locked - 1,
                  reserved = reserved + 1
              WHERE hospital_id = $1 AND bed_type = $2
          `, [booking.hospital_id, booking.bed_type]);

            // Update status
            const updateRes = await client.query(`
              UPDATE bookings SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *
          `, [id]);

            await client.query('COMMIT');
            return updateRes.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    // Reject Booking
    static async reject(id, reason) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id]);
            const booking = bookingRes.rows[0];

            if (!booking) throw new Error('Booking not found');

            // Release locked bed back to available (if pending) or reserved back to available (if approved - cancellation)
            // Simplified: Assume rejecting pending bookings primarily
            await client.query(`
              UPDATE bed_categories
              SET locked = locked - 1,
                  available = available + 1
              WHERE hospital_id = $1 AND bed_type = $2
          `, [booking.hospital_id, booking.bed_type]);

            const updateRes = await client.query(`
              UPDATE bookings SET status = 'rejected', rejection_reason = $2, updated_at = NOW() WHERE id = $1 RETURNING *
          `, [id, reason]);

            await client.query('COMMIT');
            return updateRes.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}

module.exports = BookingModel;
