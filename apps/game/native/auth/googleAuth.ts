import { useEffect, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export function useNativeGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const resolverRef = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        const idToken = response.params?.id_token || response.authentication?.idToken || null;
        resolverRef.current?.(idToken);
      } else {
        resolverRef.current?.(null);
      }
      resolverRef.current = null;
    }
  }, [response]);

  const getIdToken = async (): Promise<string | null> => {
    return new Promise(async (resolve) => {
      resolverRef.current = resolve;
      try {
        const res = await promptAsync();
        if (res.type === 'success') {
          const idToken = res.params?.id_token || res.authentication?.idToken || null;
          resolve(idToken);
          resolverRef.current = null;
        } else if (res.type !== 'dismiss') {
          resolve(null);
          resolverRef.current = null;
        }
      } catch {
        resolve(null);
        resolverRef.current = null;
      }
    });
  };

  return {
    isReady: !!request,
    getIdToken,
  };
}
