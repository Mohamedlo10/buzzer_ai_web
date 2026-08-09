import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { wsManager } from '~/lib/websocket';

/**
 * Hook to automatically reconnect WebSocket when the app comes back to the foreground
 * (e.g. from background on iOS/Android).
 */
export function useAppStateReconnect() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppState] Returned to foreground — forcing WS reconnect');
        }
        wsManager.reconnect();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
