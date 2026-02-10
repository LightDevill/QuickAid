const AnalyticsService = require('../services/analytics.service');

const getDashboardStats = async (req, res, next) => {
    try {
        const result = await AnalyticsService.getDashboardStats();
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getAnalyticsReport = async (req, res, next) => {
    try {
        const { type } = req.params; // bookings, performance
        const result = await AnalyticsService.getAnalyticsReport(type);
        res.json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
};

module.exports = {
    getDashboardStats,
    getAnalyticsReport,
};
