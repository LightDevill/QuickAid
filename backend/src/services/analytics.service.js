const AnalyticsModel = require('../models/analytics.model');
const redis = require('../config/redis');

class AnalyticsService {
    static async getDashboardStats() {
        // Cache for 30s
        const cacheKey = 'analytics:dashboard';
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const stats = await AnalyticsModel.getDashboardStats();
        await redis.setEx(cacheKey, 30, JSON.stringify(stats));
        return stats;
    }

    static async getAnalyticsReport(type) {
        if (type === 'bookings') {
            return await AnalyticsModel.getBookingTrends();
        }
        if (type === 'performance') {
            return await AnalyticsModel.getHospitalPerformance();
        }
        return {};
    }
}

module.exports = AnalyticsService;
