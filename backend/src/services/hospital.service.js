const HospitalModel = require('../models/hospital.model');
const { calculateMatchScore } = require('../utils/matching');
const redis = require('../config/redis');

class HospitalService {
    // Search
    static async searchHospitals(params) {
        const { lat, lng, bed_type, radius_km } = params;

        // Try cache first
        const cacheKey = `search:${lat}:${lng}:${bed_type}:${radius_km}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Get all active hospitals
        // In a real app with PostGIS, we'd filter by distance in DB
        let hospitals = await HospitalModel.findAllActive();

        // Manually filter by distance and calculate score
        // And fetch bed info for them (lazy loading or eager loading in findAllActive - eager better here)
        // For MVP, findAllActive returns basic info, we need detailed info or join
        // We'll update model to fetch beds or loop

        // Optimization: Fetch all hospitals with beds
        // We will perform a more complex query in Model later, for now iterate
        const results = [];

        for (const hosp of hospitals) {
            const detailed = await HospitalModel.findById(hosp.id);

            // Check distance
            const score = calculateMatchScore(detailed, { lat, lng, severity: 'moderate' }); // Default severity

            // Filter by radius (approx check from score or recalc distance)
            // Let's rely on score or re-calc distance
            // detailed.distance = ... (already calc in match score if we returned it)

            if (score > 0) { // arbitrary cutoff
                results.push({ ...detailed, match_score: score });
            }
        }

        results.sort((a, b) => b.match_score - a.match_score);

        // Cache
        await redis.setEx(cacheKey, 30, JSON.stringify(results));

        return results;
    }

    // Get Details
    static async getHospital(id) {
        return await HospitalModel.findById(id);
    }

    // Update Beds
    static async updateBeds(hospitalId, updates) {
        const { bed_type, available, total } = updates;
        const updated = await HospitalModel.updateBeds(hospitalId, bed_type, available, total);

        // Invalidate cache
        const keys = await redis.keys('search:*');
        if (keys.length > 0) await redis.del(keys);

        return updated;
    }

    // Get Doctors
    static async getAvailableDoctors(hospitalId, specialty) {
        return await HospitalModel.getAvailableDoctors(hospitalId, specialty);
    }

    // Get Doctor by ID
    static async getDoctor(id) {
        return await HospitalModel.getDoctorById(id);
    }
}

module.exports = HospitalService;
