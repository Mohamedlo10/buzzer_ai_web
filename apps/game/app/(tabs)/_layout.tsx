import { Fragment, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TabBar } from '~/components/layout/TabBar';
import { palette } from '~/lib/theme/tokens';
import { useAuthStore } from '~/stores/useAuthStore';
import { useThemeStore } from '~/native/theme/useThemeStore';

export default function TabsLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  // S'abonner au thème fait aussi re-rendre la TabBar et `sceneStyle` à la bascule.
  const theme = useThemeStore((s) => s.theme);

  // Auth guard: if session resolution is done and user has no token, bounce to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
      }}
      // Remonte le contenu des onglets au changement de thème (cf. app/_layout.tsx).
      screenLayout={({ children }) => <Fragment key={theme}>{children}</Fragment>}
    >
      <Tabs.Screen name="rooms" options={{ title: 'Multijoueur' }} />
      <Tabs.Screen name="solo" options={{ title: 'Solo' }} />
      <Tabs.Screen name="rankings" options={{ title: 'Classement' }} />
      <Tabs.Screen name="friends" options={{ title: 'Amis' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
