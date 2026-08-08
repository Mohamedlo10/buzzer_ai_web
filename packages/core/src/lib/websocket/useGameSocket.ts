import { useEffect, useRef, useCallback, useState } from 'react';
import { wsManager } from './WebSocketManager';
import { handleWSEvent } from './handlers';
import type { WSEvent } from '~/types/websocket';
import { useAuthStore } from '~/stores/useAuthStore';

type EventHandler = (event: WSEvent) => void;

interface UseGameSocketOptions {
  /** Specific event types to listen to (in addition to default store dispatching) */
  onEvent?: EventHandler;
  /** Called when WebSocket reconnects after a drop — use to re-sync state */
  onReconnect?: () => void;
}

/**
 * React hook that manages the WebSocket connection lifecycle
 * for a game session. Connects on mount, disconnects on unmount,
 * and dispatches all events through the central handler.
 *
 * @param sessionId - The session to connect to (null = don't connect)
 * @param options - Optional extra event handler + reconnect callback
 */
export function useGameSocket(
  sessionId: string | null,
  options?: UseGameSocketOptions,
): {
  send: (data: Record<string, unknown>) => void;
  isConnected: boolean;
} {
  const onEventRef = useRef(options?.onEvent);
  onEventRef.current = options?.onEvent;

  const onReconnectRef = useRef(options?.onReconnect);
  onReconnectRef.current = options?.onReconnect;

  const currentUserIdRef = useRef(useAuthStore.getState().user?.id);
  const [isConnected, setIsConnected] = useState(false);

  // Keep userId ref in sync without triggering reconnection
  useEffect(() => {
    return useAuthStore.subscribe((s) => {
      currentUserIdRef.current = s.user?.id;
    });
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = wsManager.subscribe((event: WSEvent | any) => {
      // Handle internal connection events (not real WS events)
      if (event.type === '_connection_change') {
        setIsConnected(event.connected);
        return;
      }
      if (event.type === '_reconnected') {
        onReconnectRef.current?.();
        return;
      }

      // Dispatch to Zustand stores
      handleWSEvent(event, currentUserIdRef.current);

      // Forward to optional component-level handler
      onEventRef.current?.(event);
    });

    // Pass userId so WebSocketManager can subscribe to user-specific queues
    const userId = currentUserIdRef.current;
    wsManager.connect(sessionId, userId ?? undefined);

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [sessionId]);

  const send = useCallback((data: Record<string, unknown>) => {
    wsManager.send(data);
  }, []);

  return {
    send,
    isConnected,
  };
}
