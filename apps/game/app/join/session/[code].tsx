import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { palette } from '~/lib/theme/tokens';

export default function JoinSessionByCodeScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    if (code) {
      router.replace(`/session/${code}/categories` as any);
    }
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
        Connexion à la session…
      </Text>
      <ActivityIndicator size="small" color={palette.primary} />
    </SafeAreaView>
  );
}
