import { useEffect, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { notify } from '~/lib/ui/notify';

WebBrowser.maybeCompleteAuthSession();

// Fallback dummy client IDs if environment variables are not set, preventing Google.useAuthRequest from crashing on app startup
const fallbackClientId = '1234567890-placeholder.apps.googleusercontent.com';
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || fallbackClientId;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || fallbackClientId;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || fallbackClientId;

const isGoogleConfigured = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
);

// Dans Expo Go, Google interdit les schémas exp:// et les client IDs natifs.
// On force donc l'utilisation du Web Client ID avec le proxy officiel Expo (auth.expo.io).
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function useNativeGoogleAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    isExpoGo
      ? {
          clientId: webClientId,
          redirectUri: 'https://auth.expo.io/@mohamedesp/buzzmaster-ai',
        }
      : {
          webClientId,
          iosClientId,
          androidClientId,
        }
  );

  const resolverRef = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        const idToken = response.params?.id_token || response.authentication?.idToken || null;
        if (idToken) {
          resolverRef.current?.(idToken);
          resolverRef.current = null;
        }
      } else if (response.type === 'cancel' || response.type === 'dismiss' || response.type === 'error') {
        resolverRef.current?.(null);
        resolverRef.current = null;
      }
    }
  }, [response]);

  const getIdToken = async (): Promise<string | null> => {
    if (!isGoogleConfigured) {
      notify.error('La connexion Google n’est pas configurée dans cet environnement.');
      return null;
    }
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      void (async () => {
        try {
          const res = await promptAsync();
          if (res.type === 'success') {
            const idToken = res.params?.id_token || res.authentication?.idToken || null;
            if (idToken) {
              resolve(idToken);
              resolverRef.current = null;
            }
            // Si le token n'est pas immédiatement accessible dans le résultat synchrone de promptAsync,
            // on ne résout pas avec null : on laisse le useEffect sur `response` trancher dès que
            // l'échange de token asynchrone est terminé.
          } else if (res.type === 'cancel' || res.type === 'dismiss') {
            resolve(null);
            resolverRef.current = null;
          } else {
            resolve(null);
            resolverRef.current = null;
          }
        } catch {
          resolve(null);
          resolverRef.current = null;
        }
      })();
    });
  };

  return {
    isReady: !!request,
    getIdToken,
  };
}
