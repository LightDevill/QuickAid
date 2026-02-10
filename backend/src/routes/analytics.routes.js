const express = require('express');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/analytics/dashboard', analyticsController.getDashboardStats);
router.get('/analytics/reports/:type', analyticsController.getAnalyticsReport);

module.exports = router;
