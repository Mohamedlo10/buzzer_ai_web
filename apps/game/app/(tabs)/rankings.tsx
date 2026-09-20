import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Search,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react-native';

import { useLeaderboard, useGlobalRankings, useMyGlobalRank } from '~/lib/query/hooks';
import { usePullToRefresh } from '~/lib/query/usePullToRefresh';
import { useAuthStore } from '~/stores/useAuthStore';
import type { LeaderboardPeriodType } from '~/types/leaderboards';
import { LoadingState, EmptyState, ErrorState } from '~/components/ui';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { AppTopBar } from '~/components/shared/AppTopBar';
import { AdSlot } from '~/components/shared/AdSlot';
import { AdAwareScrollView } from '~/components/partner/AdAwareScrollView';
import { PlayerProfileModal } from '~/components/shared/PlayerProfileModal';

const PAGE_SIZE = 20;

export type RankingTabType = 'GLOBAL' | LeaderboardPeriodType;

const TABS: { key: RankingTabType; label: string }[] = [
  { key: 'GLOBAL', label: 'Mondial' },
  { key: 'SEASON', label: 'Saison' },
  { key: 'WEEK', label: 'Semaine' },
  { key: 'DAY', label: 'Jour' },
];

function getPaginationRange(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'dots', total];
  }
  if (current >= total - 3) {
    return [1, 'dots', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'dots', current - 1, current, current + 1, 'dots', total];
}

export default function RankingsScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [selectedTab, setSelectedTab] = useState<RankingTabType>('GLOBAL');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGlobalMode = selectedTab === 'GLOBAL';

  // ── 1. Classement Mondial ──
  const globalQuery = useGlobalRankings(currentPage, searchUsername || undefined);
  const myGlobalRankQuery = useMyGlobalRank();

  // ── 2. Classement Périodes (Défi du Jour) ──
  const periodQuery = useLeaderboard(
    selectedTab === 'GLOBAL' ? 'SEASON' : selectedTab,
    currentPage,
    searchUsername || undefined,
  );

  const activeQuery = isGlobalMode ? globalQuery : periodQuery;
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    if (isGlobalMode) {
      await Promise.all([globalQuery.refetch(), myGlobalRankQuery.refetch()]);
    } else {
      await periodQuery.refetch();
    }
  });

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchUsername(text.trim());
      setCurrentPage(0);
    }, 400);
  };

  const changeTab = (next: RankingTabType) => {
    if (next === selectedTab) return;
    setSelectedTab(next);
    setCurrentPage(0);
    setSearchInput('');
    setSearchUsername('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    setCurrentPage(page);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Normalisation des données selon l'onglet actif
  let entries: Array<{
    userId: string;
    username: string;
    avatarUrl?: string | null;
    avatarSpec?: string | null;
    rank: number;
    scoreText: string;
    subtitle: string;
    isMe: boolean;
  }> = [];

  let totalPages = 1;
  let totalPlayers = 0;
  let myEntryRank: number | null = null;
  let myEntryScoreText: string | null = null;

  if (isGlobalMode) {
    const rawContent = globalQuery.data?.content ?? [];
    totalPages = Math.max(1, globalQuery.data?.totalPages ?? 1);
    totalPlayers = globalQuery.data?.totalElements ?? 0;

    if (myGlobalRankQuery.data?.rank) {
      myEntryRank = myGlobalRankQuery.data.rank;
      const elo = myGlobalRankQuery.data.glickoRating !== undefined
        ? Math.round(Number(myGlobalRankQuery.data.glickoRating))
        : 1500;
      myEntryScoreText = `${elo} ELO`;
    } else if (globalQuery.data?.currentUserRank) {
      myEntryRank = globalQuery.data.currentUserRank;
    }

    entries = rawContent.map((item, idx) => {
      const isMe = item.userId === currentUser?.id || item.friendshipStatus === 'SELF';
      const rankNum = item.rank || (currentPage * PAGE_SIZE + idx + 1);
      const wins = item.totalWins ?? 0;
      const games = item.totalGames ?? 0;
      const winRate = item.winRate !== undefined ? Math.round(Number(item.winRate)) : (games > 0 ? Math.round((wins / games) * 100) : 0);
      const elo = item.glickoRating !== undefined ? Math.round(Number(item.glickoRating)) : 1500;

      return {
        userId: item.userId,
        username: item.username,
        avatarUrl: item.avatarUrl,
        avatarSpec: item.avatarSpec,
        rank: rankNum,
        scoreText: `${elo} ELO`,
        subtitle: `${games} ${games > 1 ? 'parties' : 'partie'} · ${wins} ${wins > 1 ? 'victoires' : 'victoire'} (${winRate}%)`,
        isMe,
      };
    });
  } else {
    const periodData = periodQuery.data;
    totalPages = Math.max(1, periodData?.totalPages ?? 1);
    totalPlayers = periodData?.totalPlayers ?? 0;

    if (periodData?.me) {
      myEntryRank = periodData.me.rank;
      myEntryScoreText = `${periodData.me.points.toLocaleString('fr-FR')} pts`;
    }

    entries = (periodData?.entries ?? []).map((item, idx) => {
      const rankNum = item.rank || (currentPage * PAGE_SIZE + idx + 1);
      return {
        userId: item.userId,
        username: item.username,
        avatarUrl: item.avatarUrl,
        avatarSpec: item.avatarSpec,
        rank: rankNum,
        scoreText: `${item.points.toLocaleString('fr-FR')} pts`,
        subtitle: `${item.challengesPlayed} défis · ${item.correctAnswers} bonnes réponses`,
        isMe: item.isMe,
      };
    });
  }

  const handleGoToMyRank = () => {
    if (!myEntryRank) return;
    setSearchInput('');
    setSearchUsername('');
    setCurrentPage(Math.floor((myEntryRank - 1) / PAGE_SIZE));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const showPodium = currentPage === 0 && !searchUsername && entries.length >= 3;
  const podiumList = showPodium ? [entries[1], entries[0], entries[2]] : [];
  const listItems = showPodium ? entries.slice(3) : entries;
  const paginationItems = getPaginationRange(currentPage + 1, totalPages);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <AppTopBar title="Xalaat" tag={isGlobalMode ? 'CLASSEMENT MONDIAL' : 'CLASSEMENT DÉFIS'} />

      <AdAwareScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 110,
          maxWidth: 540,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Sélecteur d'onglets (Mondial, Saison, Semaine, Jour) */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: palette.surface2,
            borderRadius: 999,
            padding: 4,
            marginBottom: 14,
          }}
        >
          {TABS.map((tab) => {
            const active = tab.key === selectedTab;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => changeTab(tab.key)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? palette.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: active ? palette.primaryInk : palette.inkSoft,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sous-titre dynamique */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text
            style={{
              fontFamily: font.nativeFamily.serif,
              fontStyle: 'italic',
              fontSize: 14,
              color: palette.inkSoft,
            }}
          >
            {isGlobalMode
              ? `Classement général (Cote Elo) · ${totalPlayers} joueur${totalPlayers > 1 ? 's' : ''}`
              : `${periodQuery.data?.periodLabel || 'Défi du Jour'} · ${totalPlayers} joueur${totalPlayers > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Carte "Ton classement" (cliquable pour sauter à sa page) */}
        {myEntryRank ? (
          <TouchableOpacity
            onPress={handleGoToMyRank}
            activeOpacity={0.8}
            style={{
              backgroundColor: `${palette.primary}12`,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: `${palette.primary}38`,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: palette.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy size={18} color={palette.primaryInk} />
              </View>
              <View>
                <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 1, color: palette.primary, textTransform: 'uppercase' }}>
                  {isGlobalMode ? 'Ton rang mondial' : 'Ton classement'}
                </Text>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 16,
                    lineHeight: 22,
                    color: palette.txt,
                    paddingTop: 2,
                  }}
                >
                  Rang #{myEntryRank}
                  {myEntryScoreText ? ` · ${myEntryScoreText}` : ''}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: palette.primaryInk }}>
                Ma position
              </Text>
              <ChevronRight size={14} color={palette.primaryInk} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Barre de recherche + Bouton d'infos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.surface,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: palette.line,
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 8,
            }}
          >
            <Search size={16} color={palette.inkSoft} />
            <TextInput
              value={searchInput}
              onChangeText={handleSearchChange}
              placeholder="Rechercher un joueur…"
              placeholderTextColor={palette.inkSoft}
              style={{ flex: 1, color: palette.txt, fontSize: 13.5 }}
            />
            {searchInput ? (
              <TouchableOpacity onPress={() => handleSearchChange('')} activeOpacity={0.7}>
                <X size={16} color={palette.inkSoft} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setShowInfoModal(true)}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info size={17} color={palette.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* Podium Top 3 (affiché sur page 0 sans recherche) */}
        {showPodium && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
            {podiumList.map((p, i) => {
              const rankNum = i === 1 ? 1 : i === 0 ? 2 : 3;
              const isFirst = rankNum === 1;
              const isSecond = rankNum === 2;
              const name = p?.username || 'Joueur';

              return (
                <TouchableOpacity
                  key={p?.userId || rankNum}
                  onPress={() => {
                    if (p?.userId) {
                      setSelectedProfileUserId(p.userId);
                    }
                  }}
                  activeOpacity={0.75}
                  style={{ flex: isFirst ? 1.15 : 1, alignItems: 'center' }}
                >
                  <View style={{ position: 'relative', marginBottom: 8 }}>
                    <Avatar
                      name={name}
                      avatarSpec={p?.avatarSpec}
                      avatarUrl={p?.avatarUrl}
                      size={isFirst ? 64 : 50}
                      hue={isFirst ? 45 : isSecond ? 320 : 200}
                    />
                    {isFirst && (
                      <View style={{ position: 'absolute', top: -14, left: '50%', transform: [{ translateX: -10 }] }}>
                        <Text style={{ fontSize: 18 }}>👑</Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      width: '100%',
                      backgroundColor: palette.surface,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isFirst ? palette.gold : palette.line,
                      paddingVertical: 10,
                      paddingHorizontal: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, marginBottom: 2 }}>
                      {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: palette.txt,
                      }}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: palette.primary, marginTop: 2 }}>
                      {p?.scoreText}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* États de chargement et d'erreur */}
        {activeQuery.isError && entries.length === 0 ? (
          <ErrorState
            error={activeQuery.error}
            fallbackMessage="Impossible de charger le classement."
            onRetry={() => void activeQuery.refetch()}
          />
        ) : activeQuery.isLoading && entries.length === 0 ? (
          <LoadingState label="Chargement du classement…" />
        ) : listItems.length === 0 ? (
          <EmptyState
            title={searchUsername ? 'Aucun joueur trouvé' : 'Personne au classement'}
            description={
              searchUsername
                ? 'Essaie un autre pseudonyme.'
                : isGlobalMode
                ? 'Joue des parties pour inaugurer le classement mondial !'
                : 'Sois le premier à jouer le Défi du Jour sur cette période.'
            }
          />
        ) : (
          <View style={{ gap: 8, marginBottom: 16 }}>
            {listItems.map((item, index) => {
              const rankNumber = showPodium
                ? index + 4
                : currentPage * PAGE_SIZE + (index + 1);
              const isMe = item.isMe;

              return (
                <TouchableOpacity
                  key={item.userId}
                  onPress={() => {
                    if (item.userId) {
                      setSelectedProfileUserId(item.userId);
                    }
                  }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isMe ? `${palette.primary}12` : palette.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isMe ? palette.primary : palette.line,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontSize: 13,
                        lineHeight: 18,
                        color: rankNumber <= 3 ? palette.gold : palette.inkSoft,
                        minWidth: 36,
                        paddingTop: 3,
                        paddingBottom: 1,
                      }}
                      numberOfLines={1}
                    >
                      #{rankNumber}
                    </Text>
                    <Avatar name={item.username} avatarSpec={item.avatarSpec} avatarUrl={item.avatarUrl} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13.5,
                          fontWeight: '700',
                          color: isMe ? palette.primary : palette.txt,
                        }}
                        numberOfLines={1}
                      >
                        {item.username} {isMe ? '(toi)' : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 1 }} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontWeight: '800',
                        color: palette.txt,
                      }}
                    >
                      {item.scoreText}
                    </Text>
                    <ChevronRight size={14} color={palette.inkSoft} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Barre de pagination */}
        {totalPages > 1 && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              paddingVertical: 10,
              paddingHorizontal: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0 || activeQuery.isLoading}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage === 0 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={18} color={palette.txt} />
            </TouchableOpacity>

            {paginationItems.map((item, idx) => {
              if (item === 'dots') {
                return (
                  <View
                    key={`dots-${idx}`}
                    style={{
                      width: 28,
                      height: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: palette.inkSoft }}>
                      …
                    </Text>
                  </View>
                );
              }

              const pageIdx = item - 1;
              const isActive = pageIdx === currentPage;

              return (
                <TouchableOpacity
                  key={`page-${item}`}
                  onPress={() => goToPage(pageIdx)}
                  disabled={activeQuery.isLoading}
                  activeOpacity={0.75}
                  style={{
                    minWidth: 36,
                    height: 36,
                    paddingHorizontal: 6,
                    borderRadius: 12,
                    backgroundColor: isActive ? palette.primary : palette.bg,
                    borderWidth: 1,
                    borderColor: isActive ? palette.primary : palette.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '800',
                      color: isActive ? palette.primaryInk : palette.txt,
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || activeQuery.isLoading}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
              }}
            >
              <ChevronRight size={18} color={palette.txt} />
            </TouchableOpacity>
          </View>
        )}

        <AdSlot placement="RANKINGS" />
      </AdAwareScrollView>

      {/* Modale d'explication */}
      <Modal visible={showInfoModal} transparent animationType="fade" onRequestClose={() => setShowInfoModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 18, color: palette.txt }}>
                Système de classement
              </Text>
              <TouchableOpacity
                onPress={() => setShowInfoModal(false)}
                activeOpacity={0.7}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: palette.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={palette.txt} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ color: palette.txt, fontWeight: '700' }}>Classement Mondial (Cote Elo) :</Text> Basé
              sur le système de cote Elo (Glicko-2) en multijoueur. Votre rang s&apos;ajuste selon la difficulté
              de vos adversaires et vos victoires.
            </Text>

            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ color: palette.txt, fontWeight: '700' }}>Classement Défis (Jour / Semaine / Saison) :</Text> Se base sur vos points cumulés au Défi du Jour quotidien. La saison repart de zéro chaque mois.
            </Text>

            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20 }}>
              <Text style={{ color: palette.primary, fontWeight: '700' }}>À égalité de points (Défis) :</Text> Le
              nombre de bonnes réponses et le temps de réponse départagent les joueurs.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Player Profile Bottom Sheet Modal */}
      <PlayerProfileModal
        userId={selectedProfileUserId}
        onClose={() => setSelectedProfileUserId(null)}
      />
    </View>
  );
}
