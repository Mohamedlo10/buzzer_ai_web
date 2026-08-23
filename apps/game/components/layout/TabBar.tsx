import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Grid, Gamepad2, Trophy, Users, User } from 'lucide-react-native';
import { useAuthStore } from '~/stores/useAuthStore';
import { palette, font } from '~/lib/theme/tokens';

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
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
        paddingHorizontal: 8,
        backgroundColor: palette.surface,
        borderTopWidth: 1,
        borderTopColor: palette.line,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 8,
      }}
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

        const iconColor = isFocused ? palette.primary : palette.inkSoft;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
            }}
          >
            <View
              style={{
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 12,
                paddingVertical: 3,
                borderRadius: 9999,
                backgroundColor: isFocused ? 'rgba(224, 86, 36, 0.12)' : 'transparent',
              }}
            >
              <IconComponent size={20} color={iconColor} />
              {route.name === 'profile' && showUnconfirmedBadge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: palette.bad,
                    borderWidth: 1,
                    borderColor: palette.surface,
                  }}
                />
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: isFocused ? '700' : '600',
                color: isFocused ? palette.primary : palette.inkSoft,
                marginTop: 2,
              }}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
