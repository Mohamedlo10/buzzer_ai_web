import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { palette } from '~/lib/theme/tokens';
import * as roomsApi from '~/lib/api/rooms';
import { notifyApiError } from '~/lib/ui/notify';

export default function JoinRoomByCodeScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    if (!code) return;

    roomsApi
      .joinRoom(code)
      .then((res) => {
        router.replace(`/room/${res.room.id}` as any);
      })
      .catch((err) => {
        notifyApiError(err, 'Impossible de rejoindre le salon');
        router.replace('/(tabs)/rooms' as any);
      });
  }, [code, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: palette.primary + '26',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={36} color={palette.primary} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: palette.txt }}>
        Connexion au salon…
      </Text>
      <ActivityIndicator size="small" color={palette.primary} />
    </SafeAreaView>
  );
}
