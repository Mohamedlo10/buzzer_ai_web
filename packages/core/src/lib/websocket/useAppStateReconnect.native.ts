import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { wsManager } from './WebSocketManager';

/**
 * Native (iOS / Android) implementation of useAppStateReconnect using React Native AppState.
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
