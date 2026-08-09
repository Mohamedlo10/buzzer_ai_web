import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Grid, Gamepad2, Trophy, Users, User } from 'lucide-react-native';
import { useAuthStore } from '~/stores/useAuthStore';
import { palette, inkAlpha } from '~/lib/theme/tokens';

export type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

const TAB_CONFIG: Record<
  string,
  { label: string; icon: typeof Grid }
> = {
  rooms: { label: 'Multijoueur', icon: Grid },
  dashboard: { label: 'Solo', icon: Gamepad2 },
  rankings: { label: 'Classement', icon: Trophy },
  friends: { label: 'Amis', icon: Users },
  profile: { label: 'Profil', icon: User },
};

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const showUnconfirmedBadge = Boolean(user && (!user.email || !user.emailVerified));

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="flex-row items-center justify-around bg-surface border-t border-line pt-2 px-1 z-50 shadow-sm"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const config = TAB_CONFIG[route.name] || {
          label: options.title || route.name,
          icon: Grid,
        };

        const IconComponent = config.icon;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const iconColor = isFocused ? palette.primary : inkAlpha.muted;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            className="flex-1 flex-col items-center justify-center py-1.5"
          >
            <View className="relative flex-col items-center justify-center">
              <IconComponent size={22} color={iconColor} />
              {route.name === 'profile' && showUnconfirmedBadge ? (
                <View className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-bad border border-bg" />
              ) : null}
            </View>
            <Text
              className={`text-[10.5px] font-semibold mt-1 ${
                isFocused ? 'text-accent' : 'text-txt-40'
              }`}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
