import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SessionConfigForm } from '~/components/session/SessionConfigForm';
import { palette } from '~/lib/theme/tokens';
import { resolvePostCreationRoute } from '~/lib/game/sessionRouting';
import type { SessionResponse } from '~/types/api';

/**
 * Écran de création de session multi-étapes.
 *
 * Nécessite un `roomId` en query param (cohérent avec web-legacy).
 * Sans roomId → retour vers les salles.
 */
export default function CreateSessionScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();

  useEffect(() => {
    if (!roomId) {
      router.replace('/(tabs)/rooms');
    }
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccess = (_sessionId: string, code: string, session?: SessionResponse) => {
    const route = resolvePostCreationRoute({
      code,
      sessionMode: session?.sessionMode ?? 'WITHOUT_MODERATOR',
      categorySelectionMode: session?.categorySelectionMode,
    });
    router.replace(route as any);
  };

  if (!roomId) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <SessionConfigForm
        onSuccess={handleSuccess}
        onClose={() => router.back()}
        onNavigate={(route) => router.replace(route as any)}
        roomId={roomId}
      />
    </SafeAreaView>
  );
}
