// src/api/realtimeApi.js

const SSE_BASE_URL = import.meta.env.VITE_SSE_URL || 'http://localhost:3004';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3004';
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// ============================================
// SSE - Server Sent Events
// ============================================

// Connect to booking updates via SSE (callback style)
export const connectToBookingUpdates = (bookingId, callbacks = {}) => {
    const { onStatusChange, onMessage, onError, onOpen } = callbacks;

    // MOCK IMPLEMENTATION
    if (MOCK_MODE) {
        console.log(`[MOCK SSE] Connecting to booking/${bookingId}`);
        let intervalId;

        setTimeout(() => {
            console.log('[MOCK SSE] Connected');
            onOpen?.({ message: 'Mock SSE Connected' });

            // Send periodic updates
            intervalId = setInterval(() => {
                const mockUpdate = {
                    type: 'status_update',
                    status: 'processing',
                    message: `Mock update for booking ${bookingId} at ${new Date().toLocaleTimeString()}`,
                    timestamp: new Date().toISOString()
                };
                console.log('[MOCK SSE] Mock update sent:', mockUpdate);
                onMessage?.(mockUpdate);
                onStatusChange?.(mockUpdate);
            }, 10000); // Every 10 seconds
        }, 500);

        return {
            close: () => {
                console.log(`[MOCK SSE] Closing connection for ${bookingId}`);
                clearInterval(intervalId);
            },
            eventSource: { readyState: 1 }, // OPEN
            getState: () => 1,
        };
    }

    const url = `${SSE_BASE_URL}/v1/realtime/booking/${bookingId}/events`;

    console.log(`[SSE] Connecting to ${url}`);

    const eventSource = new EventSource(url);

    // Connection opened
    eventSource.addEventListener('init', (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[SSE] Connected:', data);
            onOpen?.(data);
        } catch (err) {
            console.log('[SSE] Init event received');
            onOpen?.();
        }
    });

    // Named 'update' events
    eventSource.addEventListener('update', (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[SSE] Update received:', data);
            onMessage?.(data);

            if (data.status || data.type === 'status_change') {
                onStatusChange?.(data);
            }
        } catch (err) {
            console.error('[SSE] Parse error:', err);
        }
    });

    // Named 'status_update' events
    eventSource.addEventListener('status_update', (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[SSE] Status update:', data);
            onStatusChange?.(data);
            onMessage?.(data);
        } catch (err) {
            console.error('[SSE] Status update parse error:', err);
        }
    });

    // Heartbeat events
    eventSource.addEventListener('heartbeat', () => {
        console.log('[SSE] Heartbeat received');
    });

    // Generic messages (fallback)
    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[SSE] Message received:', data);
            onMessage?.(data);

            if (data.status || data.type === 'status_change') {
                onStatusChange?.(data);
            }
        } catch (err) {
            console.log('[SSE] Raw message:', event.data);
        }
    };

    // Error handling
    eventSource.onerror = (error) => {
        console.error('[SSE] Error:', error);
        onError?.(error);

        if (eventSource.readyState === EventSource.CLOSED) {
            console.log(`[SSE] Connection closed for booking ${bookingId}`);
        }
    };

    return {
        close: () => {
            console.log(`[SSE] Closing connection for booking ${bookingId}`);
            eventSource.close();
        },
        eventSource,
        getState: () => eventSource.readyState,
    };
};

// Simple SSE connection (original style - 3 params)
export const connectSSE = (bookingId, onMessage, onError = null) => {
    // Reuse the main function or mock it similarly if needed
    // For now, let's just use the main implementation but return the raw EventSource
    // Note: The mock above returns a wrapper object, not EventSource directly.
    // If strict EventSource return is needed, we'd need a MockEventSource class.
    // For simplicity, we'll assume consumers use the wrapper or we mock minimal EventSource API.

    if (MOCK_MODE) {
        // Limited mock for legacy calls
        const mock = connectToBookingUpdates(bookingId, { onMessage, onError });
        return mock.eventSource;
    }

    const url = `${SSE_BASE_URL}/v1/realtime/booking/${bookingId}/events`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('init', (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('SSE connected:', data);
        } catch (err) {
            console.log('SSE connected');
        }
    });

    eventSource.addEventListener('update', (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (err) {
            console.error('SSE parse error:', err);
        }
    });

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (err) {
            console.log('SSE raw message:', event.data);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        if (onError) onError(error);
    };

    return eventSource;
};

// SSE with auto-reconnect
export const connectToBookingUpdatesWithReconnect = (bookingId, callbacks = {}, options = {}) => {
    const { maxRetries = 5, retryDelay = 3000 } = options;
    let retryCount = 0;
    let connection = null;
    let isManualClose = false;

    const connect = () => {
        connection = connectToBookingUpdates(bookingId, {
            ...callbacks,
            onOpen: (data) => {
                retryCount = 0;
                callbacks.onOpen?.(data);
            },
            onError: (error) => {
                callbacks.onError?.(error);

                if (!isManualClose && retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[SSE] Reconnecting... attempt ${retryCount}/${maxRetries}`);
                    connection?.close();
                    setTimeout(connect, retryDelay * retryCount);
                } else if (retryCount >= maxRetries) {
                    console.error(`[SSE] Max retries reached for booking ${bookingId}`);
                }
            },
        });
    };

    connect();

    return {
        close: () => {
            isManualClose = true;
            connection?.close();
        },
        getConnection: () => connection,
        getRetryCount: () => retryCount,
    };
};

// ============================================
// WebSocket Connection
// ============================================

// WebSocket connection (callback style)
export const connectWebSocket = (entityId, callbacks = {}) => {
    const { onMessage, onStatusChange, onError, onOpen, onClose } = typeof callbacks === 'function'
        ? { onMessage: callbacks }
        : callbacks;

    // MOCK IMPLEMENTATION
    if (MOCK_MODE) {
        console.log(`[MOCK WS] Connecting to entity ${entityId}`);
        let intervalId;

        setTimeout(() => {
            console.log('[MOCK WS] Connected');
            onOpen?.();

            intervalId = setInterval(() => {
                const mockMsg = {
                    type: 'message',
                    text: `Mock WS message for ${entityId}`,
                    timestamp: new Date().toISOString()
                };
                console.log('[MOCK WS] Msg:', mockMsg);
                onMessage?.(mockMsg);
            }, 15000);
        }, 300);

        return {
            send: (data) => console.log('[MOCK WS] Sending:', data),
            close: () => {
                console.log(`[MOCK WS] Closing ${entityId}`);
                clearInterval(intervalId);
                onClose?.({ code: 1000, reason: 'Mock Close' });
            },
            getState: () => 1, // OPEN
            ws: { readyState: 1 },
        };
    }

    const url = `${WS_BASE_URL}/ws?entity_id=${entityId}`;

    console.log(`[WS] Connecting to ${url}`);

    const ws = new WebSocket(url);

    ws.onopen = () => {
        console.log(`[WS] Connected for entity ${entityId}`);
        onOpen?.();
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('[WS] Message received:', data);
            onMessage?.(data);

            if (data.status || data.type === 'status_change') {
                onStatusChange?.(data);
            }
        } catch (err) {
            console.log('[WS] Raw message:', event.data);
            onMessage?.(event.data);
        }
    };

    ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        onError?.(error);
    };

    ws.onclose = (event) => {
        console.log(`[WS] Closed: code=${event.code}, reason=${event.reason}`);
        onClose?.(event);
    };

    return {
        send: (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(typeof data === 'string' ? data : JSON.stringify(data));
            } else {
                console.warn('[WS] Cannot send - connection not open');
            }
        },
        close: () => {
            console.log(`[WS] Closing connection for entity ${entityId}`);
            ws.close();
        },
        getState: () => ws.readyState,
        ws,
    };
};

// WebSocket with auto-reconnect
export const connectWebSocketWithReconnect = (entityId, callbacks = {}, options = {}) => {
    const { maxRetries = 5, retryDelay = 3000 } = options;
    let retryCount = 0;
    let connection = null;
    let isManualClose = false;

    const connect = () => {
        connection = connectWebSocket(entityId, {
            ...callbacks,
            onOpen: () => {
                retryCount = 0;
                callbacks.onOpen?.();
            },
            onClose: (event) => {
                callbacks.onClose?.(event);

                if (!isManualClose && retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[WS] Reconnecting... attempt ${retryCount}/${maxRetries}`);
                    setTimeout(connect, retryDelay * retryCount);
                } else if (retryCount >= maxRetries) {
                    console.error(`[WS] Max retries reached for entity ${entityId}`);
                }
            },
            onError: (error) => {
                callbacks.onError?.(error);
            },
        });
    };

    connect();

    return {
        send: (data) => connection?.send(data),
        close: () => {
            isManualClose = true;
            connection?.close();
        },
        getConnection: () => connection,
        getRetryCount: () => retryCount,
    };
};

// ============================================
// Legacy object export (backward compatibility)
// ============================================

export const realtimeApi = {
    connectSSE,
    connectWebSocket,
    connectToBookingUpdates,
    connectToBookingUpdatesWithReconnect,
    connectWebSocketWithReconnect,
};

export default realtimeApi;
