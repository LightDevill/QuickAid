const WebSocket = require('ws');
const logger = require('../config/logger');

const initWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server, path: '/ws' }); // Attach to HTTP server

    wss.on('connection', (ws, req) => {
        const entityId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('entity_id');
        logger.info(`WebSocket Connected: ${entityId}`);

        ws.entityId = entityId;

        ws.on('message', (message) => {
            logger.info(`Received: ${message}`);
            // Echo or handle logic
        });

        ws.on('close', () => {
            logger.info(`WebSocket Disconnected: ${entityId}`);
        });

        // Send heartbeat
        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                // ws.ping(); // Standard ping
            } else {
                clearInterval(interval);
            }
        }, 30000);
    });

    return wss;
};

module.exports = initWebSocketServer;
