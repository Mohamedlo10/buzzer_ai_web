import { useEffect } from 'react';
import { Stack } from 'expo-router';
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
import '../global.css';

import { useAuthStore } from '@xalaat/core';
import {
  registerForPushNotificationsAsync,
  unregisterPushNotificationsAsync,
} from '~/native/notifications/pushNotifications';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

SplashScreen.preventAutoHideAsync();

import { Platform, View } from 'react-native';
import { apiClient } from '@xalaat/core';

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [loaded, error] = useFonts({
    [font.nativeFamily.display]: Boldonse_400Regular,
    [font.nativeFamily.ui]: Manrope_400Regular,
    [font.nativeFamily.serif]: InstrumentSerif_400Regular_Italic,
    ManropeMedium: Manrope_500Medium,
    ManropeSemiBold: Manrope_600SemiBold,
    ManropeBold: Manrope_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Server maintenance check
  useEffect(() => {
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
  }, [router]);

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
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
