import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { XalaatMark } from './XalaatMark';
import { Avatar } from './Avatar';
import { useAuthStore } from '~/stores/useAuthStore';
import { palette, font } from '~/lib/theme/tokens';

export function AppTopBar({
  title = 'Xalaat',
  tag = 'QUIZ BY MOUHADEV',
  back = false,
  onBack,
}: {
  title?: string;
  tag?: string;
  back?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: palette.bg,
      }}
    >
      {/* Brand / Logo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {back && (
          <TouchableOpacity
            onPress={onBack || (() => router.back())}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 2,
            }}
          >
            <ArrowLeft size={18} color={palette.txt} />
          </TouchableOpacity>
        )}

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <XalaatMark size={20} color={palette.primaryInk} accent={palette.gold} />
        </View>

        <View>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 16,
              letterSpacing: -0.2,
              color: palette.txt,
              lineHeight: 18,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 9,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: palette.primary,
              fontWeight: '700',
            }}
          >
            {tag}
          </Text>
        </View>
      </View>

      {/* Right actions: Notifications & Avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={() => router.push('/notifications' as any)}
          activeOpacity={0.7}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={16} color={palette.txt} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile' as any)}
          activeOpacity={0.8}
        >
          <Avatar name={user?.username || 'Momo'} avatarUrl={user?.avatarUrl} size={34} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
