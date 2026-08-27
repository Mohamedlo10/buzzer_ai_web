import { useState } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '~/stores/useAuthStore';
import {
  useDashboardV2,
  useSoloCareers,
  useTrainingSessions,
  useTrainingHistory,
  useGlobalRankings,
} from '~/lib/query/hooks';
import { palette } from '~/lib/theme/tokens';
import { AppTopBar } from '~/components/shared/AppTopBar';
import { QuizOfTheDayCard } from '~/components/shared/QuizOfTheDayCard';
import { SoloHubCard } from '~/components/shared/SoloHubCard';

// Specialized Solo Components
import { SoloGreeting } from '~/components/solo/SoloGreeting';
import { SoloModeCards } from '~/components/solo/SoloModeCards';
import { SoloProgressPills } from '~/components/solo/SoloProgressPills';
import { MyRankCard } from '~/components/solo/MyRankCard';

export default function SoloScreen() {
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  // ── Queries ──
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useDashboardV2();

  const {
    data: careersData,
    refetch: refetchCareers,
  } = useSoloCareers();

  const {
    data: trainingSessionsData,
    refetch: refetchTrainingSessions,
  } = useTrainingSessions();

  const {
    data: trainingHistoryData,
    refetch: refetchTrainingHistory,
  } = useTrainingHistory();

  const {
    data: rankingsData,
    refetch: refetchRankings,
  } = useGlobalRankings(0);

  // ── Pull-to-Refresh ──
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchDashboard(),
        refetchCareers(),
        refetchTrainingSessions(),
        refetchTrainingHistory(),
        refetchRankings(),
      ]);
    } catch { }
    setRefreshing(false);
  };

  // ── Derived Data from Existing Backend ──
  const username = user?.username || 'Joueur';
  const globalStats = dashboardData?.globalStats;
  const rank = globalStats?.rank;
  const totalScore = globalStats?.totalScore || 0;
  const winRate = globalStats?.winRate || 0;
  const totalGames = globalStats?.totalGames || 0;

  // Active career (first active career or null)
  const activeCareer = (careersData || []).find((c) => c.status === 'ACTIVE') || null;

  // Active training session (first in-progress session or null)
  const inProgressTrainingSession =
    (trainingSessionsData || []).find((s) => s.status === 'IN_PROGRESS') || null;

  // Calculate highest current streak from training history if available
  const currentStreak = Math.max(
    ...(trainingHistoryData || []).map((m) => m.currentStreak || 0),
    0
  );

  // Top rankings preview (first 3)
  const topRankings = (rankingsData?.content || []).slice(0, 3);

  // Initial loading state
  if (isDashboardLoading && !dashboardData) {
    return (
      <SafeAreaView
        edges={['top']}
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14, marginTop: 12, fontWeight: '600' }}>
          Chargement de votre cockpit solo…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <AppTopBar title="Xalaat" tag="MODE SOLO" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 36,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
      >
        {/* 1. Header Greeting */}
        <SoloGreeting username={username} />

        {/* 2. Dernières sessions actives (Carrière en cours & Entraînement en cours) */}
        <SoloModeCards
          activeCareer={activeCareer}
          trainingSession={inProgressTrainingSession}
        />

        {/* 3. Carte Noire divisée en deux : Profil Carrière & Profil Entraînement */}
        <SoloHubCard
          activeCareer={activeCareer}
          trainingSession={inProgressTrainingSession}
        />



        {/* 4. Quiz du jour (Action immédiate) */}
        <QuizOfTheDayCard />

        {/* 5. Classement Mondial & Rivaux */}
        <MyRankCard
          myRank={rank}
          myScore={totalScore}
          myUsername={username}
          topRankings={topRankings}
        />
        {/* 3. Métriques clés (Rang, Points, Succès, Parties/Série) */}
        {/* <SoloProgressPills
          rank={rank}
          totalScore={totalScore}
          winRate={winRate}
          totalGames={totalGames}
          currentStreak={currentStreak}
        /> */}
      </ScrollView>
    </View>
  );
}
