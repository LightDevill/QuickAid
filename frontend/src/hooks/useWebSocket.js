import { useEffect, useRef, useState } from 'react';
import { realtimeApi } from '../api/realtimeApi';

const useWebSocket = (entityId, onMessage, enabled = true) => {
    const wsRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!enabled || !entityId) return;

        console.log(`Connecting to WebSocket for entity: ${entityId}`);

        const handleMessage = (data) => {
            console.log('WebSocket message received:', data);
            if (onMessage) {
                onMessage(data);
            }
        };

        const handleError = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        // Connect to WebSocket
        wsRef.current = realtimeApi.connectWebSocket(
            entityId,
            handleMessage,
            handleError
        );

        // Set connected state when connection opens
        if (wsRef.current) {
            wsRef.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
            };
        }

        // Cleanup on unmount
        return () => {
            if (wsRef.current) {
                console.log('Closing WebSocket connection');
                wsRef.current.close();
                wsRef.current = null;
                setIsConnected(false);
            }
        };
    }, [entityId, enabled, onMessage]);

    const sendMessage = (message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    };

    return {
        isConnected,
        sendMessage,
        disconnect: () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
                setIsConnected(false);
            }
        },
    };
};

export default useWebSocket;
