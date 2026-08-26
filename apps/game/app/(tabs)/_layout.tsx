import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TabBar } from '~/components/layout/TabBar';
import { palette } from '~/lib/theme/tokens';
import { useAuthStore } from '~/stores/useAuthStore';

export default function TabsLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Auth guard: if session resolution is done and user has no token, bounce to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen name="rooms" options={{ title: 'Multijoueur' }} />
      <Tabs.Screen name="solo" options={{ title: 'Solo' }} />
      <Tabs.Screen name="rankings" options={{ title: 'Classement' }} />
      <Tabs.Screen name="friends" options={{ title: 'Amis' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
