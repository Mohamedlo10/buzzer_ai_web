/**
 * daily/result.tsx — Écran de résultat du Défi du Jour
 *
 * Reçoit l'attemptId via searchParams (passé par play.tsx via router.replace).
 * Charge le résultat via GET /api/daily/attempts/{attemptId}/result.
 * Affiche DailyResultSummary — aucune logique de calcul ici.
 *
 * §23 : unlockedAchievements est une List<String> de codes dans la réponse V1.
 * Pour afficher la modale avec les objets complets, on appelle useUnseenAchievements()
 * au montage — ce qui sert aussi de filet de rattrapage si l'appli a été fermée.
 */
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Home } from 'lucide-react-native';

import * as dailyApi from '~/lib/api/daily';
import { useUnseenAchievements, useMarkAchievementsSeen } from '~/lib/query/hooks';
import { LoadingState, ErrorState } from '~/components/ui/StateViews';
import { DailyResultSummary } from '~/components/daily/DailyResultSummary';
import { AdSlot } from '~/components/shared/AdSlot';
import { BadgeUnlockedModal } from '~/components/achievements/BadgeUnlockedModal';
import { palette, font } from '~/lib/theme/tokens';

export default function DailyResultScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['daily', 'result', attemptId],
    queryFn: () => dailyApi.getAttemptResult(attemptId),
    enabled: !!attemptId,
    staleTime: 1000 * 60 * 5, // 5 min — résultat stable une fois calculé
  });

  // §23 — badges débloqués lors de cette tentative.
  // unlockedAchievements dans la réponse est List<String> (codes), pas des AchievementResponse.
  // getUnseen() retourne les objets complets et couvre aussi le rattrapage.
  const { data: unseenBadges } = useUnseenAchievements();
  const { mutate: markSeen } = useMarkAchievementsSeen();

  if (!attemptId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <ErrorState fallbackMessage="Identifiant de tentative manquant." />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <LoadingState label="Calcul du résultat…" fullScreen />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <ErrorState
          fallbackMessage="Impossible de charger le résultat."
          onRetry={refetch}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Modale badges débloqués (§23) */}
      {unseenBadges && unseenBadges.length > 0 && (
        <BadgeUnlockedModal
          badges={unseenBadges}
          onClose={(ids) => markSeen(ids)}
        />
      )}

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 22,
            lineHeight: 28,
            color: palette.txt,
            paddingTop: 4,
            flex: 1,
          }}
        >
          Résultat du jour
        </Text>
      </View>

      {/* Publicité RESULT — retourne null si ads.enabled=false */}
      <AdSlot placement="RESULT" />

      {/* Résumé */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <DailyResultSummary result={data} />
      </View>

      {/* Actions */}
      <View
        style={{
          padding: 20,
          paddingBottom: 32,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          backgroundColor: palette.bg,
          gap: 12,
        }}
      >
        {/* Voir classement */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/rankings' as any)}
          activeOpacity={0.85}
          style={{
            backgroundColor: palette.primary,
            borderRadius: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Trophy size={18} color={palette.primaryInk} />
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '800',
              fontSize: 15,
              color: palette.primaryInk,
            }}
          >
            Voir le classement
          </Text>
        </TouchableOpacity>

        {/* Retour accueil */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/solo' as any)}
          activeOpacity={0.8}
          style={{
            backgroundColor: palette.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.line,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Home size={16} color={palette.inkSoft} />
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '600',
              fontSize: 14,
              color: palette.inkSoft,
            }}
          >
            Retour à l'accueil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
