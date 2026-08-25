import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  BarChart3,
  Zap,
  Crown,
  Medal,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react-native';

import { Podium } from '~/components/game/results/Podium';
import { TeamLeaderboard } from '~/components/game/TeamLeaderboard';
import { CategoryQuestionsModal } from '~/components/game/results/CategoryQuestionsModal';
import { Avatar } from '~/components/shared/Avatar';
import { useAuthStore } from '~/stores/useAuthStore';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as rankingsApi from '~/lib/api/rankings';
import { appStorage } from '~/lib/utils/storage';
import { palette, font } from '~/lib/theme/tokens';
import { teamColor as resolveTeamColor } from '~/lib/game/teamColors';
import type { SessionRankingEntry, CategoryRankingResponse, CategoryRanking } from '~/types/api';

function rankLabel(index: number): string {
  if (index === 0) return 'VAINQUEUR';
  if (index === 1) return 'CHALLENGER';
  if (index === 2) return '3ÈME';
  return `${index + 1}ÈME`;
}

const CATEGORY_COLORS = [
  palette.primary,
  palette.indigo,
  palette.violet,
  palette.warn,
  palette.bad,
  palette.good,
  palette.gold,
  palette.accent,
];

function getCategoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('basket') || n.includes('sport') || n.includes('foot') || n.includes('tennis')) return '🏆';
  if (n.includes('music') || n.includes('musique')) return '🎵';
  if (n.includes('cinéma') || n.includes('cinema') || n.includes('film')) return '🎬';
  if (n.includes('science') || n.includes('bio') || n.includes('chimie')) return '🔬';
  if (n.includes('histoire') || n.includes('history')) return '📜';
  if (n.includes('géo') || n.includes('geo') || n.includes('monde')) return '🌍';
  if (n.includes('math')) return '📐';
  if (n.includes('info') || n.includes('tech') || n.includes('code')) return '💻';
  if (n.includes('culin') || n.includes('food') || n.includes('cuisine')) return '🍽️';
  if (n.includes('animal') || n.includes('nature')) return '🦁';
  if (n.includes('langue') || n.includes('english') || n.includes('anglais')) return '🗣️';
  return '📚';
}

interface TeamEntry {
  id: string;
  name: string;
  color: string;
  score: number;
  players: SessionRankingEntry[];
}

export default function SessionResultsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 16);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 16);

  const { code, sessionId: paramSessionId, roomId: paramRoomId } = useLocalSearchParams<{
    code: string;
    sessionId?: string;
    roomId?: string;
  }>();

  const [rankings, setRankings] = useState<SessionRankingEntry[] | null>(null);
  const [categoryRankings, setCategoryRankings] = useState<CategoryRankingResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRanking | null>(null);
  const [selectedCategoryColor, setSelectedCategoryColor] = useState<string>(palette.primary);
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState<string>('📚');
  const [isLoading, setIsLoading] = useState(true);
  const [storedSessionId, setStoredSessionId] = useState<string | null>(null);
  const [capturedRoomId, setCapturedRoomId] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const storeSession = useBuzzStore((state) => state.session);
  const sessionCode = useBuzzStore((state) => state.sessionCode);
  const leaveSession = useBuzzStore((state) => state.leaveSession);

  const resolvedSessionId = paramSessionId || storeSession?.id || storedSessionId;

  useEffect(() => {
    const loadStoredSession = async () => {
      if (!paramSessionId && !storeSession?.id) {
        const stored = await appStorage.getActiveSession();
        if (stored?.sessionId) setStoredSessionId(stored.sessionId);
      }
    };
    loadStoredSession();
  }, [paramSessionId, storeSession?.id]);

  const loadRankings = useCallback(async () => {
    try {
      const identifier = resolvedSessionId || code;
      const [sessionData, categoryData] = await Promise.all([
        rankingsApi.getSessionRankings(identifier),
        rankingsApi.getCategoryRankings(identifier).catch(() => null),
      ]);
      setRankings(sessionData);
      setCategoryRankings(categoryData);

      const roomIdBeforeLeaving = useBuzzStore.getState().session?.roomId;
      if (roomIdBeforeLeaving) setCapturedRoomId(roomIdBeforeLeaving);

      leaveSession();
      await appStorage.clearActiveSession();
    } catch (err) {
      console.error('Failed to load rankings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedSessionId, code, sessionCode, leaveSession]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const resolvedRoomId = paramRoomId || storeSession?.roomId || capturedRoomId;
  const handleBack = () => {
    if (resolvedRoomId) router.replace(`/room/${resolvedRoomId}` as any);
    else router.replace('/(tabs)/rooms' as any);
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: topInset,
          paddingBottom: bottomInset,
        }}
      >
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: palette.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
        <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 16 }}>
          Chargement des résultats…
        </Text>
      </View>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: topInset,
          paddingBottom: bottomInset,
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <BarChart3 size={40} color={palette.inkSoft} />
        </View>
        <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 18, marginBottom: 6 }}>
          Aucun résultat disponible
        </Text>
        <Text style={{ color: palette.inkSoft, textAlign: 'center', fontSize: 13, marginBottom: 24 }}>
          La session est peut-être en cours ou n'a pas encore généré de classement.
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.8}
          style={{
            backgroundColor: palette.primary,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 15 }}>
            Retour à la salle
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUserRanking = rankings.find(
    (r) => (r.player.userId ?? r.player.id) === user?.id
  );
  const isSprint = rankings.some((r) => r.rawCorrectAnswers != null);
  const formatMs = (ms?: number | null) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)} s`);

  const isTeamMode = rankings.some((r) => r.teamId);
  const teamRankings: TeamEntry[] = [];
  if (isTeamMode) {
    const teamMap = new Map<string, TeamEntry>();
    rankings.forEach((entry) => {
      if (!entry.teamId || !entry.teamName) return;
      const existing = teamMap.get(entry.teamId);
      if (existing) {
        existing.players.push(entry);
        existing.score = Math.max(existing.score, entry.teamScore ?? 0);
      } else {
        teamMap.set(entry.teamId, {
          id: entry.teamId,
          name: entry.teamName,
          color: resolveTeamColor(entry.teamColor),
          score: entry.teamScore ?? 0,
          players: [entry],
        });
      }
    });
    teamRankings.push(...Array.from(teamMap.values()).sort((a, b) => b.score - a.score));
  }

  // Calculate debts
  const allDebts = rankings
    .filter((entry) => entry.debts && entry.debts.length > 0)
    .flatMap((entry) =>
      entry.debts.map((debt) => ({
        debtorId: entry.player.userId ?? entry.player.id,
        debtorName: entry.player.name,
        debtorAvatarUrl: entry.player.avatarUrl,
        creditorId: debt.owedToUserId,
        creditorName: debt.owedTo,
        category: debt.category,
        amount: debt.amount,
      }))
    );

  const correctionTotal = currentUserRanking?.corrections?.reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const debtsGivenTotal = currentUserRanking?.debts?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const debtsReceivedTotal = currentUserRanking?.debtsReceived?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const netDebt = debtsReceivedTotal - debtsGivenTotal;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* ── Sticky Header with safe notch inset ── */}
      <View
        style={{
          paddingTop: topInset,
          paddingBottom: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>

        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
          <Text
            style={{
              color: palette.txt,
              fontFamily: font.nativeFamily.display,
              fontSize: 20,
              lineHeight: 28,
              paddingTop: 6,
              paddingBottom: 2,
            }}
            numberOfLines={1}
          >
            Résultats
          </Text>
          <Text
            style={{
              color: palette.inkSoft,
              fontFamily: font.nativeFamily.serif,
              fontStyle: 'italic',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            Partie #{code}
          </Text>
        </View>

        {resolvedRoomId ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 9999,
              backgroundColor: palette.primary,
            }}
          >
            <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 12 }}>
              Retour salle
            </Text>
          </TouchableOpacity>
        ) : (
          <Avatar
            name={user?.username ?? 'U'}
            avatarUrl={user?.avatarUrl}
            size={36}
          />
        )}
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: bottomInset + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Podium ── */}
        <Podium rankings={rankings} currentUserId={user?.id} />

        {/* ── Performance Sprint (si mode Sprint) ── */}
        {isSprint && currentUserRanking && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 14,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color={palette.warn} />
              <Text
                style={{
                  color: palette.warn,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                Votre Sprint
              </Text>
            </View>

            {(() => {
              const raw = currentUserRanking.rawCorrectAnswers ?? 0;
              const ranked = currentUserRanking.correctAnswers ?? raw;
              const debtDelta = ranked - raw;

              const sprintStats = [
                {
                  label: 'RANG',
                  value: `${currentUserRanking.rank}${currentUserRanking.rank === 1 ? 'er' : 'e'}`,
                  color: palette.primary,
                },
                {
                  label: 'BRUT',
                  value: `${raw} / ${currentUserRanking.totalQuestions ?? 0}`,
                  color: palette.txt,
                },
                {
                  label: 'DETTES',
                  value: debtDelta !== 0 ? (debtDelta > 0 ? `+${debtDelta}` : `${debtDelta}`) : '0',
                  color: debtDelta < 0 ? palette.bad : debtDelta > 0 ? palette.primary : palette.txt,
                },
                {
                  label: 'FINAL',
                  value: `${ranked}`,
                  color: palette.gold,
                },
                {
                  label: 'PRÉCISION',
                  value:
                    currentUserRanking.accuracy != null
                      ? `${Math.round(currentUserRanking.accuracy * 100)} %`
                      : '—',
                  color: palette.txt,
                },
                {
                  label: 'TEMPS CUMULÉ',
                  value: formatMs(currentUserRanking.totalResponseTimeMs),
                  color: palette.primary,
                },
                {
                  label: 'MEILLEUR',
                  value: formatMs(currentUserRanking.bestResponseTimeMs),
                  color: palette.txt,
                },
              ];

              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {sprintStats.map(({ label, value, color }) => (
                    <View
                      key={label}
                      style={{
                        flex: 1,
                        minWidth: '22%',
                        backgroundColor: palette.surface2,
                        borderRadius: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 6,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: palette.inkSoft,
                          fontSize: 8.5,
                          fontWeight: '700',
                          letterSpacing: 0.5,
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 14,
                          fontWeight: '700',
                          color,
                        }}
                      >
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        )}

        {/* ── Performance globale (si mode standard) ── */}
        {!isSprint && currentUserRanking && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 14,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color={palette.warn} />
              <Text
                style={{
                  color: palette.warn,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                Performance globale
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: 'JOUEURS', value: `${rankings.length}`, color: palette.txt },
                { label: 'MAX', value: `${rankings[0]?.finalScore ?? 0}`, color: palette.gold },
                {
                  label: 'RANG',
                  value: `${currentUserRanking.rank}${currentUserRanking.rank === 1 ? 'er' : 'e'}`,
                  color: palette.primary,
                },
                { label: 'BASE', value: `${currentUserRanking.score ?? 0}`, color: palette.txt },
                {
                  label: 'CORR.',
                  value: correctionTotal !== 0 ? (correctionTotal > 0 ? `+${correctionTotal}` : `${correctionTotal}`) : '0',
                  color: palette.txt,
                },
                {
                  label: 'DETTES',
                  value: netDebt !== 0 ? (netDebt > 0 ? `+${netDebt}` : `${netDebt}`) : '0',
                  color: netDebt < 0 ? palette.bad : netDebt > 0 ? palette.primary : palette.txt,
                },
                {
                  label: 'FINAL',
                  value: `${currentUserRanking.finalScore ?? 0}`,
                  color: palette.primary,
                },
              ].map(({ label, value, color }) => (
                <View
                  key={label}
                  style={{
                    flex: 1,
                    minWidth: '22%',
                    backgroundColor: palette.surface2,
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 6,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: palette.inkSoft,
                      fontSize: 8.5,
                      fontWeight: '700',
                      letterSpacing: 0.5,
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 14,
                      fontWeight: '700',
                      color,
                    }}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Classement par équipes (si mode équipes) ── */}
        {isTeamMode && teamRankings.length > 0 && (
          <TeamLeaderboard
            teams={teamRankings.map((t) => ({
              id: t.id,
              name: t.name,
              color: resolveTeamColor(t.color),
              score: t.score,
              members: [],
            }))}
            players={rankings.map((r) => ({
              id: r.player.id,
              userId: r.player.userId,
              name: r.player.name,
              avatarUrl: r.player.avatarUrl,
              score: r.finalScore,
              isManager: false,
              isSpectator: false,
              teamId: r.teamId ?? null,
              categoryScores: {},
              selectedCategories: [],
            }))}
            currentUserId={user?.id}
          />
        )}

        {/* ── Classement individuel ── */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: palette.line,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: palette.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={15} color={palette.primary} />
              <Text
                style={{
                  color: palette.primary,
                  fontSize: 10,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {isTeamMode ? 'Classement individuel' : 'Classement'}
              </Text>
            </View>
            <Text
              style={{
                color: palette.inkSoft,
                fontSize: 9.5,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {isSprint ? 'Bonnes rép. · temps' : 'Total points'}
            </Text>
          </View>

          {rankings.map((entry, index) => {
            const isCurrentUser = (entry.player.userId ?? entry.player.id) === user?.id;
            const rankColors = [palette.gold, '#C0C0C0', '#CD7F32'];
            const scoreColor = index < 3 ? rankColors[index] : palette.txt;

            return (
              <View
                key={entry.player.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index < rankings.length - 1 ? 1 : 0,
                  borderBottomColor: palette.line,
                  backgroundColor: isCurrentUser ? palette.primary + '14' : 'transparent',
                }}
              >
                {/* Avatar with rank badge */}
                <View style={{ marginRight: 12, position: 'relative' }}>
                  <Avatar
                    name={entry.player.name}
                    avatarUrl={entry.player.avatarUrl}
                    size={38}
                  />
                  {index < 3 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: rankColors[index],
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {index === 0 ? (
                        <Crown size={10} color="#FFFFFF" />
                      ) : (
                        <Medal size={10} color="#FFFFFF" />
                      )}
                    </View>
                  )}
                </View>

                {/* Name and rank label */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontWeight: '700',
                      fontSize: 14,
                      color: isCurrentUser ? palette.primary : palette.txt,
                    }}
                    numberOfLines={1}
                  >
                    {entry.player.name}{' '}
                    {isCurrentUser && (
                      <Text style={{ fontSize: 12, fontWeight: '400', opacity: 0.6 }}>
                        (Vous)
                      </Text>
                    )}
                  </Text>
                  <Text
                    style={{
                      color: palette.inkSoft,
                      fontSize: 9.5,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {rankLabel(index)}
                  </Text>
                </View>

                {/* Score */}
                {isSprint ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontWeight: '700',
                        fontSize: 18,
                        color: scoreColor,
                      }}
                    >
                      {entry.correctAnswers ?? 0}
                    </Text>
                    <Text style={{ color: palette.inkSoft, fontSize: 10 }}>
                      {formatMs(entry.totalResponseTimeMs)}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontWeight: '700',
                        fontSize: 18,
                        color: scoreColor,
                      }}
                    >
                      {entry.finalScore}
                    </Text>
                    <Text style={{ color: palette.inkSoft, fontSize: 10 }}>pts</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Détails par catégorie (si disponibles) ── */}
        {categoryRankings?.categories && categoryRankings.categories.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text
              style={{
                color: palette.inkSoft,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              Détails par catégorie
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {categoryRankings.categories.map((cat, i) => {
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                const icon = getCategoryIcon(cat.name);
                const top = cat.rankings.slice(0, 4);
                const qCount = cat.questions?.length ?? 0;

                return (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setSelectedCategoryColor(color);
                      setSelectedCategoryIcon(icon);
                    }}
                    activeOpacity={0.75}
                    style={{
                      width: 165,
                      backgroundColor: palette.surface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: palette.line,
                      padding: 12,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: color + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{icon}</Text>
                      </View>
                      {qCount > 0 && (
                        <View
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: color + '18',
                            borderWidth: 1,
                            borderColor: color + '35',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color }}>
                            {qCount} Q
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        fontWeight: '700',
                        fontSize: 13,
                        color,
                      }}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                    <View style={{ gap: 4 }}>
                      {top.map((entry) => {
                        const isMe = entry.userId === user?.id;
                        return (
                          <View
                            key={entry.userId}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                color: isMe ? color : palette.inkSoft,
                                fontWeight: isMe ? '700' : '500',
                                flex: 1,
                                marginRight: 4,
                              }}
                              numberOfLines={1}
                            >
                              {entry.username}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: isMe ? color : palette.txt,
                              }}
                            >
                              {entry.score}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        paddingTop: 8,
                        marginTop: 2,
                        borderTopWidth: 1,
                        borderTopColor: palette.line,
                      }}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: palette.primary }}>
                        Questions
                      </Text>
                      <ChevronRight size={12} color={palette.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Dettes (si présentes) ── */}
        {allDebts.length > 0 && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: palette.line,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: palette.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Zap size={15} color={palette.warn} />
                <Text
                  style={{
                    color: palette.txt,
                    fontSize: 10,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Dettes
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  backgroundColor: palette.warn + '26',
                }}
              >
                <Text style={{ color: palette.warn, fontSize: 11, fontWeight: '700' }}>
                  {allDebts.length}
                </Text>
              </View>
            </View>

            {allDebts.map((debt, i) => {
              const iOwe = debt.debtorId === user?.id;
              const owedToMe = debt.creditorId === user?.id;
              const accentColor = iOwe
                ? palette.bad
                : owedToMe
                  ? palette.primary
                  : palette.indigo;

              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: i < allDebts.length - 1 ? 1 : 0,
                    borderBottomColor: palette.line,
                    borderLeftWidth: 3,
                    borderLeftColor: accentColor,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: palette.txt, fontSize: 13, fontWeight: '600' }}>
                      <Text style={{ fontWeight: '700' }}>{debt.debtorName}</Text>
                      {' ➔ '}
                      <Text style={{ fontWeight: '700' }}>{debt.creditorName}</Text>
                    </Text>
                    <Text style={{ color: palette.inkSoft, fontSize: 11, marginTop: 2 }}>
                      {debt.category}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 14,
                      fontWeight: '700',
                      color: accentColor,
                    }}
                  >
                    {iOwe ? `-${debt.amount}` : `+${debt.amount}`} {isSprint ? 'rép.' : 'pts'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Action de retour en bas ── */}
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.8}
          style={{
            paddingVertical: 16,
            borderRadius: 18,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 1,
          }}
        >
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 15 }}>
            {resolvedRoomId ? 'Retourner à la salle' : 'Retour aux salons'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal de détails des questions par catégorie ── */}
      <CategoryQuestionsModal
        visible={Boolean(selectedCategory)}
        category={selectedCategory}
        categoryColor={selectedCategoryColor}
        categoryIcon={selectedCategoryIcon}
        isSprint={isSprint}
        onClose={() => setSelectedCategory(null)}
      />
    </View>
  );
}
