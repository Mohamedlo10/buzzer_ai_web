// En premier : l'import déclenche le traitement du retour de Google sur le web, qui doit avoir
// lieu avant que l'application ne démarre (voir webGoogleRedirect.ts).
import {
  getWebGoogleRedirectMode,
  promoteHandoffToToken,
} from '~/native/auth/webGoogleRedirect';

import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '~/lib/query/queryClient';
import { useFonts, Boldonse_400Regular } from '@expo-google-fonts/boldonse';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';

import { font, palette } from '~/lib/theme/tokens';
import { queryKeys, useQueryFocusManager } from '~/lib/query';
import '../global.css';

import { useAuthStore } from '@xalaat/core';
import {
  registerForPushNotificationsAsync,
  unregisterPushNotificationsAsync,
} from '~/native/notifications/pushNotifications';
import * as Notifications from 'expo-notifications';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Disable Reanimated strict mode warning for render-phase value access (React 18 concurrent / layout animations)
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

/**
 * Délai laissé à l'onglet d'origine pour refermer la fenêtre de connexion Google. Il le fait
 * normalement en quelques millisecondes ; passé ce délai on considère qu'il ne répondra plus.
 */
const AUTH_HANDOFF_TIMEOUT_MS = 5000;

import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { apiClient } from '@xalaat/core';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfirmHost } from '~/components/shared/ConfirmHost';
import { useWebSocketAuthRecovery } from '~/native/websocket/useWebSocketAuthRecovery';

export default function RootLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  // Fenêtre ouverte par la connexion Google : elle rend la main à l'onglet d'origine et ne doit
  // surtout pas démarrer l'application — `restoreSession()` y effacerait le drapeau d'onboarding
  // partagé, et l'utilisateur verrait l'accueil au lieu d'être connecté.
  const [authRedirect, setAuthRedirect] = useState(getWebGoogleRedirectMode);
  const isAuthHandoff = authRedirect === 'handoff';

  useEffect(() => {
    if (!isAuthHandoff) return;
    const timer = setTimeout(
      () => setAuthRedirect(promoteHandoffToToken()),
      AUTH_HANDOFF_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [isAuthHandoff]);

  // Doit vivre à la racine : un refus d'authentification du WebSocket peut survenir sur
  // n'importe quel écran, y compris pendant une partie.
  useWebSocketAuthRecovery();

  // Rend effectif le `refetchOnWindowFocus: true` de queryClient, qui ne faisait rien sur
  // mobile faute d'écouteur de focus. Sans lui, un joueur devait fermer et rouvrir
  // l'application pour voir un défi fraîchement publié. À la racine, une seule fois : le
  // focusManager de react-query est un singleton.
  useQueryFocusManager();

  const [loaded, error] = useFonts({
    [font.nativeFamily.display]: Boldonse_400Regular,
    [font.nativeFamily.ui]: Manrope_400Regular,
    [font.nativeFamily.serif]: InstrumentSerif_400Regular_Italic,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
    ManropeBold: Manrope_700Bold,
  });

  // Restore auth session once on app start
  useEffect(() => {
    if (isAuthHandoff) return;
    restoreSession();
  }, [isAuthHandoff]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Server maintenance check
  useEffect(() => {
    if (isAuthHandoff) return;
    const checkHealth = async () => {
      try {
        const res = await apiClient.get<{ status: string; maintenance?: boolean }>('/api/health');
        if (res.data?.maintenance) {
          router.replace('/maintenance');
        }
      } catch {}
    };
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [router, isAuthHandoff]);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync();
    } else {
      unregisterPushNotificationsAsync();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.url) {
        router.push(data.url as any);
      } else if (data?.code) {
        router.push(`/session/${data.code}/lobby` as any);
      }
    });
    return () => subscription.remove();
  }, [router]);

  // Push reçue app ouverte : la bannière s'affichait, mais rien ne rechargeait l'écran — le
  // joueur lisait « Le Défi du Jour est là » au-dessus d'un accueil qui l'ignorait. On invalide
  // plutôt que de recharger : seules les cartes montées repartent aussitôt, les autres
  // requêtes attendront leur prochain montage.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      // Clé posée par DailyChallengeAnnouncer côté backend.
      if (data?.url === '/daily') {
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyToday });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    });
    return () => subscription.remove();
  }, []);

  // Avant le garde-fou des polices : cette fenêtre est éphémère, elle doit afficher quelque
  // chose tout de suite plutôt que d'attendre un chargement dont elle n'a pas besoin.
  if (isAuthHandoff) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          backgroundColor: palette.bg,
        }}
      >
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: palette.txt }}>
          Connexion en cours…
        </Text>
      </View>
    );
  }

  if (!loaded && !error) {
    return null;
  }

  const stackContent = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1, width: '100%', backgroundColor: '#EAD7BA', alignItems: 'center' }}>
            <View style={{ flex: 1, width: '100%', maxWidth: 672, backgroundColor: palette.bg }}>
              {stackContent}
            </View>
          </View>
        ) : (
          stackContent
        )}
        <ConfirmHost />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
