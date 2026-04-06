import { useEffect } from 'react';
import { wsManager } from './WebSocketManager';
import { useAuthStore } from '~/stores/useAuthStore';

/**
 * Opens a heartbeat-only WebSocket connection so the server marks
 * the current user as online. Place this in the global authenticated
 * layout so it is active on every page.
 *
 * The connection is automatically closed when the component unmounts
 * (i.e. on logout / session end).
 */
export function usePresence(): void {
  useEffect(() => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    // Subscribe so the manager keeps the connection alive while this hook is mounted
    const unsubscribe = wsManager.subscribe(() => {});

    wsManager.connectGlobal(userId);

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, []);
}
