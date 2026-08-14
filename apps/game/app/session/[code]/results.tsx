import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BarChart3, Zap, Crown, Medal, Trophy } from 'lucide-react-native';

import { Podium } from '~/components/game/results/Podium';
import { TeamLeaderboard } from '~/components/game/TeamLeaderboard';
import { useAuthStore } from '~/stores/useAuthStore';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as rankingsApi from '~/lib/api/rankings';
import { appStorage } from '~/lib/utils/storage';
import { palette } from '~/lib/theme/tokens';
import { teamColor as resolveTeamColor } from '~/lib/game/teamColors';
import type { SessionRankingEntry, CategoryRankingResponse } from '~/types/api';

function rankLabel(index: number): string {
  if (index === 0) return 'VAINQUEUR';
  if (index === 1) return 'CHALLENGER';
  if (index === 2) return '3ÈME';
  return `${index + 1}ÈME`;
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
  const { code, sessionId: paramSessionId, roomId: paramRoomId } = useLocalSearchParams<{ code: string; sessionId?: string; roomId?: string }>();

  const [rankings, setRankings] = useState<SessionRankingEntry[] | null>(null);
  const [categoryRankings, setCategoryRankings] = useState<CategoryRankingResponse | null>(null);
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
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: palette.primary + '26', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
        <Text style={{ color: palette.txt, fontWeight: '600' }}>Chargement des résultats…</Text>
      </View>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <BarChart3 size={48} color={palette.inkSoft} />
        </View>
        <Text style={{ color: palette.inkSoft, textAlign: 'center', marginBottom: 16 }}>Aucun résultat disponible</Text>
        <TouchableOpacity onPress={handleBack} style={{ backgroundColor: palette.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUserRanking = rankings.find((r) => (r.player.userId ?? r.player.id) === user?.id);
  const isSprint = rankings.some((r) => r.rawCorrectAnswers != null);
  const formatMs = (ms?: number | null) => ms == null ? '—' : `${(ms / 1000).toFixed(1)} s`;

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

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: palette.line, gap: 12 }}>
        <TouchableOpacity onPress={handleBack} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 20 }}>Résultats</Text>
          <Text style={{ color: palette.inkSoft, fontSize: 12 }}>Partie #{code}</Text>
        </View>
        {resolvedRoomId && (
          <TouchableOpacity onPress={handleBack} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: palette.primary }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>Retour salle</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 64 }}>
        <Podium rankings={rankings} currentUserId={user?.id} />

        {/* Global Rankings List */}
        <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} color={palette.primary} />
              <Text style={{ color: palette.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isTeamMode ? 'Classement individuel' : 'Classement'}
              </Text>
            </View>
            <Text style={{ color: palette.inkSoft, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
              {isSprint ? 'Bonnes rép. · temps' : 'Total points'}
            </Text>
          </View>

          {rankings.map((entry, index) => {
            const isCurrentUser = (entry.player.userId ?? entry.player.id) === user?.id;
            const rankColors = [palette.gold, '#C0C0C0', '#CD7F32'];
            const scoreColor = index < 3 ? rankColors[index] : palette.txt;

            return (
              <View key={entry.player.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: index < rankings.length - 1 ? 1 : 0, borderBottomColor: palette.line, backgroundColor: isCurrentUser ? palette.primary + '1A' : 'transparent' }}>
                <View style={{ marginRight: 12, position: 'relative' }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: palette.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: palette.txt, fontWeight: '700' }}>{entry.player.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  {index < 3 && (
                    <View style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: rankColors[index], alignItems: 'center', justifyContent: 'center' }}>
                      {index === 0 ? <Crown size={10} color="#FFFFFF" /> : <Medal size={10} color="#FFFFFF" />}
                    </View>
                  )}
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: isCurrentUser ? palette.primary : palette.txt }} numberOfLines={1}>
                    {entry.player.name} {isCurrentUser && <Text style={{ fontSize: 12, fontWeight: '400', opacity: 0.6 }}>(Vous)</Text>}
                  </Text>
                  <Text style={{ color: palette.inkSoft, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{rankLabel(index)}</Text>
                </View>

                {isSprint ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '600', fontSize: 18, color: scoreColor }}>{entry.correctAnswers ?? 0}</Text>
                    <Text style={{ color: palette.inkSoft, fontSize: 10 }}>{formatMs(entry.totalResponseTimeMs)}</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={{ fontWeight: '600', fontSize: 18, color: scoreColor }}>{entry.finalScore}</Text>
                    <Text style={{ color: palette.inkSoft, fontSize: 10 }}>pts</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity onPress={handleBack} style={{ paddingVertical: 14, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, alignItems: 'center' }}>
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>Retourner à la salle</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
