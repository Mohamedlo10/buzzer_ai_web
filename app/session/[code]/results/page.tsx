'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Trophy,
  Crown,
  Medal,
  ArrowLeft,
  Share2,
  RefreshCw,
  Home,
  Target,
  Award,
  Zap,
  BarChart3,
  Users,
  ChevronRight,
  Star,
  Sparkles,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Avatar } from '~/components/ui/Avatar';
import { FriendshipButton } from '~/components/ui/FriendshipButton';
import { useAuthStore } from '~/stores/useAuthStore';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as rankingsApi from '~/lib/api/rankings';
import * as friendsApi from '~/lib/api/friends';
import { appStorage } from '~/lib/utils/storage';
import type { SessionRankingEntry, CategoryRankingResponse } from '~/types/api';

// ── Individual Podium ────────────────────────────────────────────────────────
function Podium({ rankings }: { rankings: SessionRankingEntry[] }) {
  if (rankings.length < 3) return null;

  const [first, second, third] = rankings;

  return (
    <div className="flex flex-col items-center pt-4 pb-8 px-4">
      <div className="flex flex-row items-center gap-2 mb-6">
        <Sparkles size={20} color="#FFD700" />
        <span className="text-white/80 text-sm font-semibold tracking-wider uppercase">Podium Joueurs</span>
        <Sparkles size={20} color="#FFD700" />
      </div>

      <div className="flex flex-row items-end justify-center">
        {/* 2nd Place */}
        <div className="flex flex-col items-center mx-1">
          <div
            className="w-24 h-28 rounded-t-2xl flex flex-col items-center justify-end p-2"
            style={{ background: 'linear-gradient(135deg, #C0C0C040, #C0C0C020)' }}
          >
            <Medal size={28} color="#C0C0C0" />
          </div>
          <div className="-mt-8">
            <Avatar avatarUrl={second.player.avatarUrl} username={second.player.name} size={64} borderColor="#C0C0C0" />
          </div>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-white font-semibold text-center text-sm">{second.player.name}</span>
            {second.teamName && (
              <span className="text-white/40 text-xs">{second.teamName}</span>
            )}
            <div className="flex flex-row items-center mt-1">
              <span className="text-[#C0C0C0] font-bold text-lg">{second.finalScore}</span>
              <span className="text-white/50 text-xs ml-1">pts</span>
            </div>
          </div>
          <div className="mt-2 px-3 py-1 rounded-full bg-[#C0C0C020]">
            <span className="text-[#C0C0C0] text-xs font-bold">2ème</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center mx-1 -mt-8">
          <Crown size={32} color="#FFD700" />
          <div
            className="w-28 h-36 rounded-t-2xl flex flex-col items-center justify-end p-2 mt-2"
            style={{ background: 'linear-gradient(135deg, #FFD70050, #FFD70020)' }}
          >
            <Trophy size={32} color="#FFD700" />
          </div>
          <div className="-mt-10">
            <Avatar avatarUrl={first.player.avatarUrl} username={first.player.name} size={80} borderColor="#FFD700" />
          </div>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-white font-bold text-lg text-center">{first.player.name}</span>
            {first.teamName && (
              <span className="text-white/40 text-xs">{first.teamName}</span>
            )}
            <div className="flex flex-row items-center mt-1">
              <span className="text-[#FFD700] font-bold text-xl">{first.finalScore}</span>
              <span className="text-white/50 text-xs ml-1">pts</span>
            </div>
          </div>
          <div className="mt-2 px-4 py-1 rounded-full bg-[#FFD70030]">
            <span className="text-[#FFD700] text-xs font-bold">GAGNANT</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center mx-1">
          <div
            className="w-24 h-20 rounded-t-2xl flex flex-col items-center justify-end p-2"
            style={{ background: 'linear-gradient(135deg, #CD7F3240, #CD7F3220)' }}
          >
            <Medal size={24} color="#CD7F32" />
          </div>
          <div className="-mt-8">
            <Avatar avatarUrl={third.player.avatarUrl} username={third.player.name} size={64} borderColor="#CD7F32" />
          </div>
          <div className="mt-2 flex flex-col items-center">
            <span className="text-white font-semibold text-center text-sm">{third.player.name}</span>
            {third.teamName && (
              <span className="text-white/40 text-xs">{third.teamName}</span>
            )}
            <div className="flex flex-row items-center mt-1">
              <span className="text-[#CD7F32] font-bold text-lg">{third.finalScore}</span>
              <span className="text-white/50 text-xs ml-1">pts</span>
            </div>
          </div>
          <div className="mt-2 px-3 py-1 rounded-full bg-[#CD7F3220]">
            <span className="text-[#CD7F32] text-xs font-bold">3ème</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Team Podium ──────────────────────────────────────────────────────────────
interface TeamResult {
  teamId: string;
  teamName: string;
  teamColor: string;
  teamScore: number;
  members: SessionRankingEntry[];
}

function TeamPodium({ teams }: { teams: TeamResult[] }) {
  if (teams.length < 2) return null;

  const podiumTeams = teams.slice(0, 3);
  const [first, second, third] = podiumTeams;

  const PodiumTeamCard = ({
    team,
    height,
    medal,
    label,
    labelColor,
    borderColor,
    bg,
    mt = '',
  }: {
    team: TeamResult;
    height: string;
    medal: React.ReactNode;
    label: string;
    labelColor: string;
    borderColor: string;
    bg: string;
    mt?: string;
  }) => (
    <div className={`flex flex-col items-center mx-1 ${mt}`}>
      <div
        className={`w-24 ${height} rounded-t-2xl flex flex-col items-center justify-end p-2`}
        style={{ background: bg }}
      >
        {medal}
      </div>
      {/* Team color circle */}
      <div
        className="w-16 h-16 rounded-full border-4 flex items-center justify-center -mt-8"
        style={{ backgroundColor: `${team.teamColor}30`, borderColor }}
      >
        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: team.teamColor }} />
      </div>
      <div className="mt-2 flex flex-col items-center px-1">
        <span className="text-white font-bold text-center text-sm leading-tight">{team.teamName}</span>
        <div className="flex flex-row items-center mt-1">
          <span className="font-bold text-lg" style={{ color: labelColor }}>{team.teamScore}</span>
          <span className="text-white/50 text-xs ml-1">pts</span>
        </div>
        <span className="text-white/40 text-xs mt-0.5">{team.members.length} joueur{team.members.length > 1 ? 's' : ''}</span>
      </div>
      <div className="mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: `${labelColor}20` }}>
        <span className="text-xs font-bold" style={{ color: labelColor }}>{label}</span>
      </div>
      {/* Member avatars row */}
      <div className="flex flex-row mt-2 gap-0.5 justify-center">
        {team.members.slice(0, 4).map((m) => (
          <Avatar key={m.player.id} avatarUrl={m.player.avatarUrl} username={m.player.name} size={20} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center pt-4 pb-6 px-4">
      <div className="flex flex-row items-center gap-2 mb-6">
        <Users size={18} color="#4A90D9" />
        <span className="text-white/80 text-sm font-semibold tracking-wider uppercase">Podium Équipes</span>
        <Users size={18} color="#4A90D9" />
      </div>

      <div className="flex flex-row items-end justify-center w-full">
        {second && (
          <PodiumTeamCard
            team={second}
            height="h-28"
            medal={<Medal size={28} color="#C0C0C0" />}
            label="2ème"
            labelColor="#C0C0C0"
            borderColor="#C0C0C0"
            bg="linear-gradient(135deg, #C0C0C040, #C0C0C020)"
          />
        )}
        <PodiumTeamCard
          team={first}
          height="h-36"
          medal={<Trophy size={32} color="#FFD700" />}
          label="GAGNANT"
          labelColor="#FFD700"
          borderColor="#FFD700"
          bg="linear-gradient(135deg, #FFD70050, #FFD70020)"
          mt="-mt-8"
        />
        {third && (
          <PodiumTeamCard
            team={third}
            height="h-20"
            medal={<Medal size={24} color="#CD7F32" />}
            label="3ème"
            labelColor="#CD7F32"
            borderColor="#CD7F32"
            bg="linear-gradient(135deg, #CD7F3240, #CD7F3220)"
          />
        )}
      </div>
    </div>
  );
}

// ── Team Full Leaderboard ────────────────────────────────────────────────────
function TeamLeaderboard({
  teams,
  currentUserId,
}: {
  teams: TeamResult[];
  currentUserId: string;
}) {
  return (
    <div className="px-4 mb-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#4A90D940] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#4A90D930]">
          <div className="flex flex-row items-center gap-2">
            <Users size={20} color="#4A90D9" />
            <p className="text-white font-bold text-lg">Classement par Équipe</p>
          </div>
        </div>

        {teams.map((team, index) => {
          const isMyTeam = team.members.some(
            (m) => (m.player.userId ?? m.player.id) === currentUserId,
          );
          const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
          const rankColor = rankColors[index] ?? '#FFFFFF60';
          return (
            <div key={team.teamId} className="border-b border-[#3E3666] last:border-b-0">
              {/* Team header row */}
              <div
                className="px-5 py-3 flex flex-row items-center"
                style={{ background: isMyTeam ? '#4A90D915' : undefined }}
              >
                <div className="w-8 flex items-center mr-2">
                  {index === 0 && <Crown size={18} color="#FFD700" />}
                  {index === 1 && <Medal size={18} color="#C0C0C0" />}
                  {index === 2 && <Medal size={18} color="#CD7F32" />}
                  {index > 2 && <span className="text-white/40 font-bold">{index + 1}.</span>}
                </div>
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: team.teamColor }}
                />
                <p className={`flex-1 font-bold text-base ${isMyTeam ? 'text-[#4A90D9]' : 'text-white'}`}>
                  {team.teamName}
                  {isMyTeam && <span className="text-xs font-normal ml-1 opacity-60"> (votre équipe)</span>}
                </p>
                <span className="font-bold text-lg" style={{ color: rankColor }}>
                  {team.teamScore} pts
                </span>
              </div>

              {/* Members */}
              {team.members.map((entry) => {
                const isCurrent = (entry.player.userId ?? entry.player.id) === currentUserId;
                return (
                  <div
                    key={entry.player.id}
                    className="flex flex-row items-center px-5 py-2 border-t border-[#3E3666]/50 ml-8"
                  >
                    <Avatar
                      avatarUrl={entry.player.avatarUrl}
                      username={entry.player.name}
                      size={32}
                      borderColor={isCurrent ? '#00D397' : undefined}
                    />
                    <p className={`flex-1 ml-2 text-sm ${isCurrent ? 'text-[#00D397]' : 'text-white/70'}`}>
                      {entry.player.name}
                      {isCurrent && ' (Vous)'}
                    </p>
                    <span className="text-white/60 text-sm font-medium">{entry.finalScore} pts</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex-1 bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={20} color={color} />
      </div>
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <p className="text-white text-lg font-bold">{value}</p>
    </div>
  );
}

// Category Rankings Card
function CategoryRankingsCard({
  categoryRankings,
  userId,
}: {
  categoryRankings: CategoryRankingResponse;
  userId: string;
}) {
  if (!categoryRankings?.categories?.length) return null;

  return (
    <div className="px-4 mb-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3E3666]">
          <div className="flex flex-row items-center gap-2">
            <Target size={20} color="#00D397" />
            <p className="text-white font-bold text-lg">Par Catégorie</p>
          </div>
        </div>

        {categoryRankings.categories.map((cat, catIndex) => (
          <div
            key={cat.name}
            className={`px-5 py-4 ${catIndex < categoryRankings.categories.length - 1 ? 'border-b border-[#3E3666]' : ''}`}
          >
            <div className="flex flex-row items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#00D39720] flex items-center justify-center">
                <BarChart3 size={16} color="#00D397" />
              </div>
              <span className="text-[#00D397] font-semibold">{cat.name}</span>
            </div>

            <div className="flex flex-col gap-2">
              {cat.rankings.slice(0, 5).map((entry, idx) => (
                <div key={entry.userId} className="flex flex-row items-center py-2">
                  <div className="w-8 flex items-center">
                    {idx === 0 && <Crown size={14} color="#FFD700" />}
                    {idx === 1 && <Medal size={14} color="#C0C0C0" />}
                    {idx === 2 && <Medal size={14} color="#CD7F32" />}
                    {idx > 2 && (
                      <span className="text-white/40 text-sm font-medium">{idx + 1}.</span>
                    )}
                  </div>
                  <span
                    className={`flex-1 font-medium ${entry.userId === userId ? 'text-[#00D397]' : 'text-white'}`}
                  >
                    {entry.username}
                    {entry.userId === userId && ' (Vous)'}
                  </span>
                  <span className="text-white font-semibold">{entry.score * 5} pts</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Debt Card Component
function DebtCard({ debts }: { debts: SessionRankingEntry['debts'] }) {
  if (!debts || debts.length === 0) {
    return (
      <div className="px-4 mb-4">
        <div className="bg-[#342D5B] rounded-3xl p-6 border border-[#3E3666] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#00D39720] flex items-center justify-center mb-3">
            <Award size={32} color="#00D397" />
          </div>
          <p className="text-white font-semibold text-lg">Pas de dettes !</p>
          <p className="text-white/50 text-sm text-center mt-1">
            Tu as tout remboursé ou tu n'as rien à devoir
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3E3666]">
          <div className="flex flex-row items-center gap-2">
            <Zap size={20} color="#F59E0B" />
            <p className="text-white font-bold text-lg">Dettes</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-red-400 font-semibold mb-3">Tu dois</p>
          {debts.map((debt, i) => (
            <div
              key={`${debt.owedTo}-${debt.category}-${i}`}
              className="flex flex-row justify-between items-center py-2 border-b border-[#3E3666] last:border-b-0"
            >
              <div className="flex flex-row items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Users size={12} color="#EF4444" />
                </div>
                <span className="text-white">{debt.owedTo}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-red-400 font-semibold">{debt.amount} pts</span>
                <span className="text-white/40 text-xs">{debt.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = params.code;
  const paramSessionId = searchParams.get('sessionId') ?? undefined;
  const paramRoomId = searchParams.get('roomId') ?? undefined;

  const [rankings, setRankings] = useState<SessionRankingEntry[] | null>(null);
  const [categoryRankings, setCategoryRankings] = useState<CategoryRankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storedSessionId, setStoredSessionId] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const storeSession = useBuzzStore((state) => state.session);
  const resolvedSessionId = paramSessionId || storeSession?.id || storedSessionId;

  useEffect(() => {
    const loadStoredSession = async () => {
      if (!paramSessionId && !storeSession?.id) {
        const stored = await appStorage.getActiveSession();
        if (stored?.sessionId) {
          setStoredSessionId(stored.sessionId);
        }
      }
    };
    loadStoredSession();
  }, [paramSessionId, storeSession?.id]);

  useEffect(() => {
    if (resolvedSessionId) {
      loadRankings();
    }
  }, [resolvedSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRankings = async () => {
    if (!resolvedSessionId) return;

    try {
      const [sessionData, categoryData] = await Promise.all([
        rankingsApi.getSessionRankings(resolvedSessionId),
        rankingsApi.getCategoryRankings(resolvedSessionId).catch(() => null),
      ]);
      setRankings(sessionData);
      setCategoryRankings(categoryData);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!targetUserId || targetUserId === user?.id) return;

    try {
      await friendsApi.sendFriendRequest(targetUserId);
      await loadRankings();
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!rankings) return;

    const winner = rankings[0];
    const message = `🏆 Partie Quiz By Mouha_Dev terminée !\n\n👑 Gagnant: ${winner.player.name} (${winner.finalScore} pts)\n🎮 Code: ${code}\n\nRejoins-nous pour la prochaine partie !`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Résultats Quiz By Mouha_Dev', text: message });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(message);
      window.alert('Résultats copiés !');
    }
  };

  const resolvedRoomId = paramRoomId || storeSession?.roomId;

  const handleNewGame = () => {
    if (resolvedRoomId) {
      router.replace(`/room/${resolvedRoomId}`);
    } else {
      router.replace('/');
    }
  };

  const handleHome = () => {
    if (resolvedRoomId) {
      router.replace(`/room/${resolvedRoomId}`);
    } else {
      router.replace('/');
    }
  };

  if (isLoading) {
    return (
      <SafeScreen className="bg-[#292349]">
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
              <Trophy size={40} color="#00D397" />
            </div>
            <p className="text-white font-semibold">Chargement des résultats...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <SafeScreen className="bg-[#292349]">
        <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-screen">
          <div className="w-24 h-24 rounded-full bg-[#342D5B] flex items-center justify-center mb-4">
            <BarChart3 size={48} color="#6B7280" />
          </div>
          <p className="text-white/60 text-center mb-4">Aucun résultat disponible</p>
          <button
            onClick={handleHome}
            className="bg-[#00D397] px-8 py-4 rounded-2xl hover:bg-[#00B377] transition-colors"
          >
            <span className="text-[#292349] font-bold">Retour</span>
          </button>
        </div>
      </SafeScreen>
    );
  }

  // Detect team mode from data (don't rely on store which may be cleared)
  const isTeamMode = storeSession?.isTeamMode ?? rankings.some((r) => r.teamId != null);

  const currentUserRanking = rankings.find(
    (r) => (r.player.userId ?? r.player.id) === user?.id,
  );
  const totalCorrections = (entry: SessionRankingEntry) =>
    entry.corrections?.reduce((sum, c) => sum + c.amount, 0) || 0;

  const TEAM_PALETTE = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // Build team results from rankings — skip players without a team (e.g. manager)
  const teamResults: TeamResult[] = isTeamMode
    ? Object.values(
        rankings
          .filter((e) => e.teamId != null)
          .reduce<Record<string, TeamResult>>((acc, entry) => {
            const tid = entry.teamId!;
            if (!acc[tid]) {
              acc[tid] = {
                teamId: tid,
                teamName: entry.teamName ?? 'Équipe',
                teamColor: '#4A90D9', // assigned below by index
                teamScore: entry.teamScore ?? 0,
                members: [],
              };
            }
            acc[tid].members.push(entry);
            return acc;
          }, {}),
      )
      .sort((a, b) => b.teamScore - a.teamScore)
      .map((team, i) => ({ ...team, teamColor: TEAM_PALETTE[i % TEAM_PALETTE.length] }))
    : [];

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666] sticky top-0 z-10">
        <div className="flex flex-row items-center">
          <button
            onClick={handleHome}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">Résultats</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-white/50 text-xs">Partie #{code}</p>
              {storeSession?.isTeamMode && (
                <div className="flex items-center bg-[#4A90D920] px-2 py-0.5 rounded-full">
                  <Users size={10} color="#4A90D9" />
                  <span className="text-[#4A90D9] text-[10px] font-semibold ml-1">Mode Équipes</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
          >
            <Share2 size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto pt-4">
        {/* Team Podium — prioritaire en mode équipe */}
        {isTeamMode && teamResults.length >= 2 && (
          <TeamPodium teams={teamResults} />
        )}

        {/* Team Leaderboard */}
        {isTeamMode && teamResults.length > 0 && (
          <TeamLeaderboard teams={teamResults} currentUserId={user?.id ?? ''} />
        )}

        {/* Individual Podium */}
        <Podium rankings={rankings} />

        {/* Stats Summary */}
        <div className="px-4 mb-4">
          <div className="flex flex-row gap-3">
            <StatCard
              icon={Users}
              label="Joueurs"
              value={rankings.length}
              color="#3B82F6"
            />
            <StatCard
              icon={Trophy}
              label="Score Max"
              value={rankings[0].finalScore}
              color="#F59E0B"
            />
            <StatCard
              icon={Star}
              label="Ta Position"
              value={currentUserRanking?.rank || '-'}
              color="#00D397"
            />
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="px-4 mb-4">
          <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3E3666]">
              <div className="flex flex-row items-center gap-2">
                <BarChart3 size={20} color="#8B5CF6" />
                <p className="text-white font-bold text-lg">Classement Complet</p>
              </div>
            </div>

            <div className="px-5 py-2">
              {rankings.map((entry, index) => {
                const isCurrentUser = (entry.player.userId ?? entry.player.id) === user?.id;
                const correctionTotal = totalCorrections(entry);
                const isTop3 = index < 3;

                return (
                  <div
                    key={entry.player.id}
                    className={`flex flex-row items-center py-3 ${index < rankings.length - 1 ? 'border-b border-[#3E3666]' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-10 flex items-center">
                      {index === 0 && <Crown size={18} color="#FFD700" />}
                      {index === 1 && <Medal size={18} color="#C0C0C0" />}
                      {index === 2 && <Medal size={18} color="#CD7F32" />}
                      {index > 2 && (
                        <span className="text-white/40 font-bold">{entry.rank}.</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="mr-3">
                      <Avatar
                        avatarUrl={entry.player.avatarUrl}
                        username={entry.player.name}
                        size={40}
                        borderColor={isCurrentUser ? '#00D397' : isTop3 ? '#FFD700' : undefined}
                      />
                    </div>

                    {/* Name & Details */}
                    <div className="flex-1">
                      <p className={`font-semibold ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}>
                        {entry.player.name}
                        {isCurrentUser && (
                          <span className="text-[#00D397] text-xs"> (Vous)</span>
                        )}
                      </p>
                      {correctionTotal !== 0 && (
                        <p className="text-white/40 text-xs">
                          Base: {entry.score} • Corrections:{' '}
                          {correctionTotal > 0 ? '+' : ''}
                          {correctionTotal}
                        </p>
                      )}
                    </div>

                    {/* Friendship Button */}
                    <FriendshipButton
                      status={entry.player.friendshipStatus}
                      isCurrentUser={isCurrentUser}
                      onAddFriend={() => handleAddFriend(entry.player.userId ?? entry.player.id)}
                      size="sm"
                    />

                    {/* Score */}
                    <div className="flex flex-col items-end ml-2">
                      <span className={`font-bold text-lg ${isTop3 ? 'text-[#FFD700]' : 'text-white'}`}>
                        {entry.finalScore}
                      </span>
                      <span className="text-white/40 text-xs">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Rankings */}
        {categoryRankings && (
          <CategoryRankingsCard categoryRankings={categoryRankings} userId={user?.id || ''} />
        )}

        {/* Your Performance / Debts */}
        {currentUserRanking && (
          <DebtCard debts={currentUserRanking.debts} />
        )}

        {/* Your Stats Card */}
        {currentUserRanking && (
          <div className="px-4 mb-6">
            <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] p-5">
              <div className="flex flex-row items-center gap-2 mb-4">
                <Award size={20} color="#8B5CF6" />
                <p className="text-white font-bold text-lg">Ta Performance</p>
              </div>

              <div className="flex flex-row gap-4">
                <div className="flex-1 flex flex-col items-center p-3 bg-[#3E3666] rounded-2xl">
                  <span className="text-[#00D397] font-bold text-2xl">
                    {currentUserRanking.score}
                  </span>
                  <span className="text-white/50 text-xs mt-1">Score Base</span>
                </div>
                <div className="flex-1 flex flex-col items-center p-3 bg-[#3E3666] rounded-2xl">
                  <span className="text-[#F59E0B] font-bold text-2xl">
                    {currentUserRanking.corrections?.length || 0}
                  </span>
                  <span className="text-white/50 text-xs mt-1">Corrections</span>
                </div>
                <div className="flex-1 flex flex-col items-center p-3 bg-[#00D39720] rounded-2xl">
                  <span className="text-[#00D397] font-bold text-2xl">
                    {currentUserRanking.finalScore}
                  </span>
                  <span className="text-white/50 text-xs mt-1">Score Final</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-10">
          <button
            onClick={handleNewGame}
            className="w-full py-4 rounded-2xl flex items-center justify-center mb-3 transition-colors"
            style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
          >
            <div className="flex flex-row items-center">
              <RefreshCw size={20} color="#292349" />
              <span className="text-[#292349] font-bold text-lg ml-2">
                {paramRoomId ? 'Nouvelle partie' : 'Retour au dashboard'}
              </span>
            </div>
          </button>

          <button
            onClick={handleHome}
            className="w-full py-4 rounded-2xl bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
          >
            <div className="flex flex-row items-center">
              <Home size={20} color="#FFFFFF" />
              <span className="text-white font-bold text-lg ml-2">
                {paramRoomId ? 'Retour à la salle' : 'Accueil'}
              </span>
              <ChevronRight size={18} color="#FFFFFF" className="ml-1" />
            </div>
          </button>
        </div>
      </div>
    </SafeScreen>
  );
}
