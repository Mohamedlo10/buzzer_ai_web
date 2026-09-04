/**
 * profile/history.tsx — Mes Parties (§24)
 *
 * useInfiniteQuery sur getHistory — pagination serveur, jamais tout chargé.
 * rank null = édition en cours, pas de rang définitif → n'affiche rien à sa place.
 */
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar } from 'lucide-react-native';

import { useDailyHistory } from '~/lib/query/hooks';
import { LoadingState, EmptyState, ErrorState } from '~/components/ui/StateViews';
import { palette, font } from '~/lib/theme/tokens';
import type { DailyHistoryEntryResponse } from '~/types/api';

export default function HistoryScreen() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDailyHistory();

  const entries: DailyHistoryEntryResponse[] = data?.pages.flatMap((p) => p.content) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Écrans d'état ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <Header />
        <LoadingState label="Chargement de l'historique…" fullScreen />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        <Header />
        <ErrorState
          fallbackMessage="Impossible de charger l'historique."
          onRetry={refetch}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <Header />

      {entries.length === 0 ? (
        <EmptyState
          icon={<Calendar size={32} color={palette.inkSoft} />}
          title="Aucune partie jouée"
          description="Participe au Défi du Jour pour voir ton historique ici."
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.attemptId}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => <HistoryRow entry={item} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={palette.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Ligne d'historique ───────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: DailyHistoryEntryResponse }) {
  const dateLabel = formatDate(entry.challengeDate);
  const pct = entry.totalQuestions > 0
    ? Math.round((entry.correctCount / entry.totalQuestions) * 100)
    : 0;

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        gap: 8,
      }}
    >
      {/* Ligne 1 : date + score */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 2 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontWeight: '700',
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: palette.inkSoft,
            }}
          >
            {dateLabel}
          </Text>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 16,
              color: palette.txt,
              paddingTop: 2,
            }}
            numberOfLines={1}
          >
            {entry.theme ?? 'Défi du jour'}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 20,
              color: palette.primary,
            }}
          >
            {entry.score}
          </Text>
          <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 11, color: palette.inkSoft }}>
            / {entry.maxPoints} pts
          </Text>
        </View>
      </View>

      {/* Ligne 2 : bonnes réponses + rang (null si édition en cours) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontSize: 13,
            color: pct >= 70 ? palette.good : palette.inkSoft,
          }}
        >
          {entry.correctCount} / {entry.totalQuestions} bonnes réponses · {pct}%
        </Text>

        {/* rank null = classement pas encore figé — ne rien afficher */}
        {entry.rank !== null && entry.totalPlayers !== null && (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 9999,
              backgroundColor: palette.indigo + '22',
              borderWidth: 1,
              borderColor: palette.indigo + '44',
            }}
          >
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontWeight: '700',
                fontSize: 12,
                color: palette.indigo,
              }}
            >
              #{entry.rank} / {entry.totalPlayers}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Micro-composants ─────────────────────────────────────────────────────────

function Header() {
  const router = useRouter();

  return (
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
      <Text
        style={{
          fontFamily: font.nativeFamily.display,
          fontSize: 20,
          color: palette.txt,
          paddingTop: 4,
        }}
      >
        Mes parties
      </Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
