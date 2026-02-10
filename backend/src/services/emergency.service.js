const EmergencyModel = require('../models/emergency.model');
const HospitalService = require('./hospital.service');
const { calculateMatchScore } = require('../utils/matching');

class EmergencyService {
    // SOS
    static async createSos(data) {
        const { lat, lng, severity } = data;

        // Find matches
        // Reuse hospital search logic but optimized for emergency
        const hospitals = await HospitalService.searchHospitals({ lat, lng, bed_type: 'general', radius_km: 20 });

        // Recalculate scores specifically for emergency
        const matched = hospitals.map(h => ({
            id: h.id,
            name: h.name,
            score: calculateMatchScore(h, { lat, lng, severity })
        })).sort((a, b) => b.score - a.score).slice(0, 5);

        return await EmergencyModel.create({
            ...data,
            matched_hospitals: matched
        });
    }

    // Request Doctor
    static async requestDoctor(data) {
        return await EmergencyModel.createDoctorRequest(data);
    }

    // Ambulance
    static async sendAmbulanceAlert(data) {
        // Add logic to notify ambulance partner
        return await EmergencyModel.createAmbulanceAlert(data);
    }
}

module.exports = EmergencyService;
