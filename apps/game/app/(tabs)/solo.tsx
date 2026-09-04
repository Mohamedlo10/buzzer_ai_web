import { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';

import { GraduationCap, Trophy } from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import { useDashboardV2, useGlobalRankings } from '~/lib/query/hooks';
import { palette } from '~/lib/theme/tokens';
import { AppTopBar } from '~/components/shared/AppTopBar';
import { QuizOfTheDayCard } from '~/components/shared/QuizOfTheDayCard';
import { AdSlot } from '~/components/shared/AdSlot';
import { LoadingState, ErrorState } from '~/components/ui';

// Specialized Solo Components
import { SoloGreeting } from '~/components/solo/SoloGreeting';
import { ComingSoonCard } from '~/components/solo/ComingSoonCard';
import { MyRankCard } from '~/components/solo/MyRankCard';

// ─────────────────────────────────────────────────────────────────────────────
// Carrière et Entraînement sont reportés après la V1 (§2.2). Leurs imports sont
// commentés plutôt que supprimés : les écrans restent sur disque pour V1.1/V1.2, et
// aucun chemin de code ne peut plus y mener depuis l'accueil.
//
// Le vrai verrou n'est pas ici mais dans app/solo/_layout.tsx : expo-router étant
// file-based, un lien profond atteindrait ces écrans même sans le moindre bouton.
//
// import { SoloHubCard } from '~/components/shared/SoloHubCard';
// import { SoloModeCards } from '~/components/solo/SoloModeCards';
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Accueil solo — hub de progression, pas vitrine de fonctionnalités (§15, §34).
 *
 * <p>Hiérarchie : le Défi du Jour passe en tête. Il figurait auparavant en quatrième
 * position, derrière deux grandes cartes menant à des modes désormais reportés — alors que
 * le §34 demande que la Home réponde « Xalaat me propose un défi aujourd'hui », et non
 * « Xalaat a beaucoup de menus ».
 *
 * <p>De cinq requêtes parallèles on passe à deux : les trois qui alimentaient Carrière et
 * Entraînement n'ont plus d'objet (§27, « appels API dupliqués »).
 */
export default function SoloScreen() {
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<unknown>(null);

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardV2();

  const { data: rankingsData, refetch: refetchRankings } = useGlobalRankings(0);

  /**
   * Le `try/catch {}` précédent avalait toute erreur de rafraîchissement en silence :
   * l'utilisateur tirait pour rafraîchir, rien ne se passait, et rien ne l'expliquait.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await Promise.all([refetchDashboard(), refetchRankings()]);
    } catch (err) {
      setRefreshError(err);
    } finally {
      setRefreshing(false);
    }
  };

  const username = user?.username || 'Joueur';
  const globalStats = dashboardData?.globalStats;
  const topRankings = (rankingsData?.content || []).slice(0, 3);

  if (isDashboardLoading && !dashboardData) {
    return <LoadingState label="Chargement de ton espace…" fullScreen />;
  }

  if (isDashboardError && !dashboardData) {
    return (
      <ErrorState
        error={dashboardError}
        fallbackMessage="Impossible de charger ton espace pour le moment."
        onRetry={() => void refetchDashboard()}
        fullScreen
      />
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
        <SoloGreeting username={username} />

        {/* Action dominante de l'accueil (§16). La carte se masque d'elle-même
            s'il n'y a pas d'édition du jour. */}
        <QuizOfTheDayCard />

        {refreshError ? (
          <ErrorState
            error={refreshError}
            fallbackMessage="Le rafraîchissement a échoué."
            onRetry={() => void onRefresh()}
          />
        ) : null}

        {/* Où j'en suis par rapport aux autres (§15). */}
        <MyRankCard
          myRank={globalStats?.rank}
          myScore={globalStats?.totalScore || 0}
          myUsername={username}
          topRankings={topRankings}
        />

        {/* Publicité (HOME) — retourne null si ads.enabled=false */}
        <AdSlot placement="HOME" />

        {/* Reportés : visibles mais secondaires, et non cliquables (§18). */}
        <ComingSoonCard
          icon={Trophy}
          title="Carrière"
          description="Progresse niveau par niveau."
        />
        <ComingSoonCard
          icon={GraduationCap}
          title="Entraînement"
          description="Maîtrise de nouveaux sujets."
        />

        {/* SoloProgressPills (série, points de saison, taux de réussite) sera réactivé
            dès que `useProfileSummary` existera : ces valeurs viennent désormais de
            GET /api/daily/profile-summary, et non plus d'un Math.max calculé ici sur
            l'historique d'entraînement — un calcul métier qui n'avait rien à faire
            dans un composant, sur une source aujourd'hui masquée. */}
      </ScrollView>
    </View>
  );
}
