import { useEffect, useRef, useCallback } from 'react';

const WS_RECONNECT_DELAY = 3000;

export function useWebSocket(onMessage) {
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const connect = useCallback(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.hostname}:3000`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WS] Connected to server');
            clearTimeout(reconnectTimerRef.current);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                onMessageRef.current(msg);
            } catch (err) {
                console.error('[WS] Parse error:', err);
            }
        };

        ws.onclose = () => {
            console.log('[WS] Disconnected, retrying in 3s...');
            reconnectTimerRef.current = setTimeout(connect, WS_RECONNECT_DELAY);
        };

        ws.onerror = (err) => {
            console.error('[WS] Error:', err);
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return wsRef;
}
