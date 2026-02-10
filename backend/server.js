const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const routes = require('./src/routes');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const { ApiError, NotFoundError } = require('./src/utils/errors');
const initWebSocketServer = require('./src/websocket/wsServer');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket Server
initWebSocketServer(server);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin })); // Strictly allow frontend origin
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
if (config.env === 'production') {
    app.use('/v1', apiLimiter);
}

// Routes
app.use('/', routes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// 404 Handler
app.use((req, res, next) => {
    next(new NotFoundError('Endpoint not found'));
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
    logger.info(`QUICKAID Server running on port ${PORT}`);
    logger.info(`Environment: ${config.env}`);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
