/**
 * profile/badges.tsx — Mes badges (§20)
 *
 * Affiche le catalogue complet via useAchievementsCatalog().
 * Débloqués + verrouillés côte à côte via BadgeGrid — ce qui donne envie
 * de revenir.
 */
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Award } from 'lucide-react-native';

import { useAchievementsCatalog } from '~/lib/query/hooks';
import { LoadingState, EmptyState, ErrorState } from '~/components/ui/StateViews';
import { BadgeGrid } from '~/components/achievements/BadgeGrid';
import { palette, font } from '~/lib/theme/tokens';

export default function BadgesScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useAchievementsCatalog();

  const unlockedCount = data?.filter((b) => b.unlocked).length ?? 0;
  const totalCount = data?.length ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
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
          }}
        >
          <ChevronLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 20,
              color: palette.txt,
              paddingTop: 4,
            }}
          >
            Mes badges
          </Text>
        </View>

        {/* Compteur — totalCount vient du serveur */}
        {totalCount > 0 && (
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '700',
              fontSize: 13,
              color: palette.inkSoft,
            }}
          >
            {unlockedCount} / {totalCount}
          </Text>
        )}
      </View>

      {/* Corps */}
      {isLoading && (
        <LoadingState label="Chargement des badges…" fullScreen />
      )}

      {isError && (
        <ErrorState
          fallbackMessage="Impossible de charger les badges."
          onRetry={refetch}
          fullScreen
        />
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState
          icon={<Award size={32} color={palette.inkSoft} />}
          title="Aucun badge disponible"
          description="Le catalogue de badges sera disponible bientôt."
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={palette.primary} />
          }
        >
          <BadgeGrid badges={data} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
