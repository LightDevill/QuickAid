const express = require('express');
const authRoutes = require('./auth.routes');
const hospitalRoutes = require('./hospital.routes');
const bookingRoutes = require('./booking.routes');
const emergencyRoutes = require('./emergency.routes');
const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

// Mount routes
router.use('/v1', authRoutes); // Includes /identity and /auth
router.use('/v1', hospitalRoutes);
router.use('/v1', bookingRoutes);
router.use('/v1', emergencyRoutes);
router.use('/v1', analyticsRoutes);

module.exports = router;
