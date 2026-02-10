const { query } = require('../config/database');

class EmergencyModel {
    // Create SOS Case
    static async create(data) {
        const { user_id, severity, symptoms, lat, lng, matched_hospitals } = data;
        const text = `
      INSERT INTO emergency_cases (user_id, severity, symptoms, lat, lng, matched_hospitals)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
        const { rows } = await query(text, [user_id, severity, symptoms, lat, lng, JSON.stringify(matched_hospitals)]);
        return rows[0];
    }

    // Request Doctor
    static async createDoctorRequest(data) {
        const { emergency_id, hospital_id, context, preferred_specialty } = data;
        const text = `
        INSERT INTO doctor_requests (emergency_id, hospital_id, context, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING *;
      `;
        const { rows } = await query(text, [emergency_id, hospital_id, context]);
        return rows[0];
    }

    // Create Ambulance Alert
    static async createAmbulanceAlert(data) {
        const { booking_id, partner_id, hmac_signature } = data;
        const text = `
        INSERT INTO ambulance_alerts (booking_id, partner_id, hmac_signature)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
        const { rows } = await query(text, [booking_id, partner_id, hmac_signature]);
        return rows[0];
    }
}

module.exports = EmergencyModel;
