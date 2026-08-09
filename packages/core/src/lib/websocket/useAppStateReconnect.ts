import { useEffect } from 'react';
import { wsManager } from './WebSocketManager';

/**
 * Web implementation of useAppStateReconnect using visibilitychange API.
 */
export function useAppStateReconnect() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Visibility] Web tab active — triggering WS reconnect check');
        }
        wsManager.reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
