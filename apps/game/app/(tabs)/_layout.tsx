import { Tabs } from 'expo-router';
import { TabBar } from '~/components/layout/TabBar';
import { palette } from '~/lib/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen name="rooms" options={{ title: 'Multijoueur' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Solo' }} />
      <Tabs.Screen name="rankings" options={{ title: 'Classement' }} />
      <Tabs.Screen name="friends" options={{ title: 'Amis' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
