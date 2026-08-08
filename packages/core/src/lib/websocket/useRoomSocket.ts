import { useEffect, useRef, useState } from 'react';
import { wsManager } from './WebSocketManager';
import type { RoomMemberPresenceEvent } from '~/types/websocket';
import { useAuthStore } from '~/stores/useAuthStore';

interface UseRoomSocketOptions {
  /** Called with each incoming presence update */
  onPresence?: (event: RoomMemberPresenceEvent) => void;
  /** Called when WS disconnects (network drop, tab close) */
  onDisconnect?: () => void;
}

/**
 * Manages a WebSocket connection for a room's presence channel.
 * - Subscribes to /topic/room/{roomId}/presence
 * - Sends a heartbeat to /app/heartbeat every 60 s (started inside WebSocketManager)
 * - Calls onDisconnect immediately on transport close so the UI can mark
 *   the current user as offline without waiting for the server
 */
export function useRoomSocket(
  roomId: string | null,
  options?: UseRoomSocketOptions,
): { isConnected: boolean } {
  const onPresenceRef = useRef(options?.onPresence);
  onPresenceRef.current = options?.onPresence;

  const onDisconnectRef = useRef(options?.onDisconnect);
  onDisconnectRef.current = options?.onDisconnect;

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const userId = useAuthStore.getState().user?.id;

    const unsubscribe = wsManager.subscribe((event: any) => {
      if (event.type === '_connection_change') {
        setIsConnected(event.connected);
        if (!event.connected) {
          onDisconnectRef.current?.();
        }
        return;
      }

      if (event.type === 'room_member_presence' && event.roomId === roomId) {
        onPresenceRef.current?.(event as RoomMemberPresenceEvent);
      }
    });

    wsManager.connectForRoom(roomId, userId ?? undefined);

    return () => {
      unsubscribe();
      // After leaving the room, fall back to global heartbeat-only connection
      wsManager.connectGlobal(userId ?? undefined);
    };
  }, [roomId]);

  return { isConnected };
}
