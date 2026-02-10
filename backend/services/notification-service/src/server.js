// Notification Service - Main Server
// Handles SMS, Push notifications, WebSocket/SSE streaming

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
const redis = require('../../shared/redis');
const { logger, logRequest } = require('../../shared/logger');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3004;

// WebSocket server for real-time events
const wss = new WebSocket.Server({ server, path: '/ws' });

// Track connected clients by booking/entity ID
const clients = new Map();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => logRequest(req, res, Date.now() - start));
    next();
});

// Health check
app.get('/health', async (req, res) => {
    const redisHealthy = await redis.healthCheck();
    res.status(redisHealthy ? 200 : 503).json({
        status: redisHealthy ? 'healthy' : 'degraded',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
        websocket_clients: countClients()
    });
});

function countClients() {
    let count = 0;
    for (const set of clients.values()) {
        count += set.size;
    }
    return count;
}

/**
 * POST /notify/sms
 * Send SMS notification (stub - integrate with real provider)
 */
app.post('/notify/sms', async (req, res) => {
    const { phone, message, template } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'E_INVALID_REQUEST' });
    }

    // In production, integrate with SMS provider (Twilio, MSG91, etc.)
    logger.info('SMS sent', { phone: phone.slice(-4), template });

    res.json({
        status: 'sent',
        message_id: `SMS-${Date.now()}`,
        note: 'SMS integration pending - logged only'
    });
});

/**
 * POST /notify/push
 * Send push notification
 */
app.post('/notify/push', async (req, res) => {
    const { user_id, title, body, data } = req.body;

    if (!user_id || !title) {
        return res.status(400).json({ error: 'E_INVALID_REQUEST' });
    }

    // In production, integrate with FCM/APNs
    logger.info('Push sent', { user_id, title });

    res.json({
        status: 'sent',
        notification_id: `PUSH-${Date.now()}`
    });
});

/**
 * POST /notify/broadcast
 * Broadcast to WebSocket clients for a specific booking/entity
 */
app.post('/notify/broadcast', async (req, res) => {
    const { entity_id, event_type, payload } = req.body;

    if (!entity_id || !event_type) {
        return res.status(400).json({ error: 'E_INVALID_REQUEST' });
    }

    const message = JSON.stringify({
        type: event_type,
        ...payload,
        timestamp: new Date().toISOString()
    });

    const entityClients = clients.get(entity_id);
    let sent = 0;

    if (entityClients) {
        for (const ws of entityClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
                sent++;
            }
        }
    }

    res.json({ status: 'broadcast', clients_notified: sent });
});

/**
 * GET /v1/realtime/booking/:id/events (SSE endpoint)
 * Server-Sent Events for booking updates
 */
app.get('/v1/realtime/booking/:id/events', (req, res) => {
    const bookingId = req.params.id;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    // Send initial connection event
    res.write(`event: init\ndata: ${JSON.stringify({ booking_id: bookingId, status: 'connected' })}\n\n`);

    // Register SSE client
    if (!clients.has(bookingId)) {
        clients.set(bookingId, new Set());
    }

    const sseClient = {
        type: 'sse',
        res,
        send: (data) => res.write(`event: update\ndata: ${JSON.stringify(data)}\n\n`)
    };

    clients.get(bookingId).add(sseClient);

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30000);

    req.on('close', () => {
        clearInterval(heartbeat);
        clients.get(bookingId)?.delete(sseClient);
        if (clients.get(bookingId)?.size === 0) {
            clients.delete(bookingId);
        }
    });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const entityId = url.searchParams.get('entity_id') || url.searchParams.get('booking_id');

    if (!entityId) {
        ws.close(4000, 'entity_id required');
        return;
    }

    // Register client
    if (!clients.has(entityId)) {
        clients.set(entityId, new Set());
    }
    clients.get(entityId).add(ws);

    logger.info('WebSocket connected', { entityId });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        entity_id: entityId,
        timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
        clients.get(entityId)?.delete(ws);
        if (clients.get(entityId)?.size === 0) {
            clients.delete(entityId);
        }
        logger.info('WebSocket disconnected', { entityId });
    });

    ws.on('error', (err) => {
        logger.error('WebSocket error', { entityId, error: err.message });
    });
});

// Subscribe to Redis pub/sub for booking events
async function subscribeToEvents() {
    try {
        await redis.connect();

        const subscriber = await redis.subscribe('booking:events', (message) => {
            const { type, booking_id, ...data } = message;

            const entityClients = clients.get(booking_id);
            if (entityClients) {
                const payload = JSON.stringify({ type, booking_id, ...data, timestamp: new Date().toISOString() });

                for (const client of entityClients) {
                    try {
                        if (client.type === 'sse') {
                            client.send({ type, booking_id, ...data });
                        } else if (client.readyState === WebSocket.OPEN) {
                            client.send(payload);
                        }
                    } catch (err) {
                        logger.error('Failed to send to client', { error: err.message });
                    }
                }
            }
        });

        logger.info('Subscribed to booking:events');
    } catch (err) {
        logger.error('Failed to subscribe to Redis', { error: err.message });
    }
}

// Error handling
app.use((req, res) => res.status(404).json({ error: 'E_NOT_FOUND' }));
app.use((err, req, res, next) => {
    logger.error('Error', { error: err.message });
    res.status(500).json({ error: 'E_INTERNAL' });
});

// Graceful shutdown
async function shutdown(signal) {
    logger.info(`Received ${signal}`);

    // Close all WebSocket connections
    wss.clients.forEach(ws => ws.close(1001, 'Server shutting down'));

    server.close(async () => {
        await redis.close();
        process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000);
}

server.listen(PORT, async () => {
    logger.info(`Notification service started on port ${PORT}`);
    await subscribeToEvents();
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };
