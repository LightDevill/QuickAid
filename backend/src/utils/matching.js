const { calculateDistance } = require('./helpers');

/**
 * Calculate match score for a hospital based on criteria
 * Weights:
 * - Distance: 40%
 * - Availability: 25%
 * - ICU (if critical): 15%
 * - Oxygen (if critical): 10%
 * - Reliability: 10%
 */
const calculateMatchScore = (hospital, searchParams) => {
    const { lat, lng, severity } = searchParams;
    let score = 0;

    // 1. Distance Score (Max 40 points)
    // Assume max reasonable distance is 20km. Closer is better.
    const distance = calculateDistance(lat, lng, hospital.lat, hospital.lng);
    const maxDist = 20;
    const distScore = Math.max(0, (maxDist - distance) / maxDist) * 40;
    score += distScore;

    // 2. Availability Score (Max 25 points)
    // Check total available beds across all types or specific type if requested
    // Simplifying to check if *any* bed available
    const totalAvailable = hospital.beds ? hospital.beds.reduce((sum, b) => sum + b.available, 0) : 0;
    if (totalAvailable > 5) score += 25;
    else if (totalAvailable > 0) score += 10;

    // 3. Specialty/Severity Bonuses
    const hasICU = hospital.beds?.some(b => b.bed_type === 'icu' && b.available > 0);
    const hasOxygen = hospital.beds?.some(b => b.bed_type === 'oxygen' && b.available > 0);

    if (severity === 'critical') {
        if (hasICU) score += 15;
        if (hasOxygen) score += 10;
    } else {
        // Base bonus for having facilities
        if (hasICU) score += 5;
    }

    // 4. Reliability (Max 10 points)
    // reliability_score is 0-100
    score += (hospital.reliability_score || 0) / 10;

    return Math.min(100, Math.round(score));
};

module.exports = {
    calculateMatchScore,
};
