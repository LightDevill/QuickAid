const { query } = require('../config/database');

class HospitalModel {
    // Find all active hospitals
    static async findAllActive() {
        const text = 'SELECT * FROM hospitals WHERE is_active = TRUE';
        const { rows } = await query(text);
        return rows;
    }

    // Find hospital by ID
    static async findById(id) {
        const text = `
      SELECT h.*, 
             json_agg(bc.*) as beds
      FROM hospitals h
      LEFT JOIN bed_categories bc ON h.id = bc.hospital_id
      WHERE h.id = $1
      GROUP BY h.id;
    `;
        const { rows } = await query(text, [id]);
        return rows[0];
    }

    // Update bed inventory (Atomic)
    static async updateBeds(hospitalId, bedType, available, total) {
        const text = `
        INSERT INTO bed_categories (hospital_id, bed_type, total, available, last_updated)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (hospital_id, bed_type) 
        DO UPDATE SET 
            total = EXCLUDED.total,
            available = EXCLUDED.available,
            last_updated = NOW()
        RETURNING *;
      `;
        const { rows } = await query(text, [hospitalId, bedType, total, available]);
        return rows[0];
    }

    // Get available doctors
    static async getAvailableDoctors(hospitalId, specialty) {
        let text = 'SELECT * FROM doctors WHERE on_duty = TRUE';
        const params = [];

        if (hospitalId) {
            text += ' AND hospital_id = $' + (params.length + 1);
            params.push(hospitalId);
        }

        if (specialty) {
            text += ' AND specialty = $' + (params.length + 1);
            params.push(specialty);
        }

        const { rows } = await query(text, params);
        return rows;
    }

    // Get doctor by ID
    static async getDoctorById(id) {
        const text = 'SELECT * FROM doctors WHERE id = $1';
        const { rows } = await query(text, [id]);
        return rows[0];
    }
}

module.exports = HospitalModel;
