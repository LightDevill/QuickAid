import { useEffect, useRef } from 'react';
import { realtimeApi } from '../api/realtimeApi';

const useSSE = (bookingId, onMessage, enabled = true) => {
    const eventSourceRef = useRef(null);

    useEffect(() => {
        if (!enabled || !bookingId) return;

        console.log(`Connecting to SSE for booking: ${bookingId}`);

        const handleMessage = (data) => {
            console.log('SSE message received:', data);
            if (onMessage) {
                onMessage(data);
            }
        };

        const handleError = (error) => {
            console.error('SSE error:', error);
        };

        // Connect to SSE
        eventSourceRef.current = realtimeApi.connectSSE(
            bookingId,
            handleMessage,
            handleError
        );

        // Cleanup on unmount
        return () => {
            if (eventSourceRef.current) {
                console.log('Closing SSE connection');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [bookingId, enabled, onMessage]);

    return {
        disconnect: () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        },
    };
};

export default useSSE;
