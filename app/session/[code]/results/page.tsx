'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Zap,
  Crown,
  Medal,
  Trophy,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Avatar } from '~/components/ui/Avatar';
import { FriendshipButton } from '~/components/ui/FriendshipButton';
import { PlayerProfileModal } from '~/components/ui/PlayerProfileModal';
import { Podium } from '~/components/results/Podium';
import { useAuthStore } from '~/stores/useAuthStore';
import { useBuzzStore } from '~/stores/useBuzzStore';
import * as rankingsApi from '~/lib/api/rankings';
import * as friendsApi from '~/lib/api/friends';
import { appStorage } from '~/lib/utils/storage';
import type { SessionRankingEntry, CategoryRankingResponse } from '~/types/api';

// ── Rank label ────────────────────────────────────────────────────────────────
function rankLabel(index: number): string {
  if (index === 0) return 'VAINQUEUR';
  if (index === 1) return 'CHALLENGER';
  if (index === 2) return '3ÈME';
  return `${index + 1}ÈME`;
}

// ── Category card helpers ─────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  '#00D397', '#4A90D9', '#9B59B6', '#F59E0B', '#D5442F', '#EC4899',
  '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16',
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

// ── Team Rankings Card ────────────────────────────────────────────────────────
interface TeamEntry {
  id: string;
  name: string;
  color: string;
  score: number;
  players: SessionRankingEntry[];
}

function TeamRankingsCard({ teamRankings }: { teamRankings: TeamEntry[] }) {
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Trophy size={16} color="#F59E0B" />
          <p className="text-txt-60 font-bold text-xs tracking-widest uppercase">Classement par équipe</p>
        </div>
        <p className="text-txt-40 text-xs font-semibold tracking-wider uppercase">Points équipe</p>
      </div>

      {teamRankings.map((team, index) => {
        const scoreColor = index < 3 ? rankColors[index] : '#FFFFFF';
        return (
          <div
            key={team.id}
            className={`px-4 py-3 ${index < teamRankings.length - 1 ? 'border-b border-line' : ''}`}
            style={{ borderLeft: `3px solid ${team.color}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {index === 0 && <Crown size={14} color="#FFD700" />}
                <span className="font-bold text-base" style={{ color: team.color }}>{team.name}</span>
                <span className="text-txt-40 text-xs">{team.players.length} joueur{team.players.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg" style={{ color: scoreColor }}>{team.score}</span>
                <span className="text-txt-40 text-xs">pts</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {team.players.map((p) => (
                <span key={p.player.id} className="text-xs bg-bg rounded-full px-2 py-0.5 text-txt-60">
                  {p.player.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Category Rankings Card ────────────────────────────────────────────────────
function CategoryRankingsCard({
  categoryRankings,
  userId,
}: {
  categoryRankings: CategoryRankingResponse;
  userId: string;
}) {
  if (!categoryRankings?.categories?.length) return null;

  return (
    <div className="mb-4">
      <p className="text-txt-60 text-xs font-bold tracking-widest uppercase px-4 mb-3">
        Détails par catégorie
      </p>

      <div className="flex flex-row gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
        {categoryRankings.categories.map((cat, i) => {
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          const icon = getCategoryIcon(cat.name);
          const top = cat.rankings.slice(0, 5);
          const initials = cat.name.slice(0, 2).toUpperCase();

          return (
            <div
              key={cat.name}
              className="flex-shrink-0 bg-surface rounded-2xl border border-line p-4"
              style={{ width: 160 }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={{ backgroundColor: `${color}25` }}
              >
                {icon === '📚' ? (
                  <span className="text-xs font-bold" style={{ color }}>{initials}</span>
                ) : (
                  <span className="text-lg">{icon}</span>
                )}
              </div>

              {/* Category name */}
              <p className="font-bold text-sm mb-3 truncate" style={{ color }}>{cat.name}</p>

              {/* Rankings */}
              <div className="flex flex-col gap-2">
                {top.map((entry) => {
                  const isMe = entry.userId === userId;
                  const score = entry.score > 0 ? `${entry.score}` : '—';
                  return (
                    <div key={entry.userId} className="flex items-center justify-between">
                      <span
                        className="text-xs truncate flex-1 mr-2"
                        style={{ color: isMe ? color : '#FFFFFF80' }}
                      >
                        {entry.username.split(' ')[0]}
                      </span>
                      <span
                        className="text-xs font-bold shrink-0"
                        style={{ color: isMe ? color : '#FFFFFFCC' }}
                      >
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const storeSession = useBuzzStore((state) => state.session);
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

  useEffect(() => {
    if (resolvedSessionId) loadRankings();
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
    } catch { /* ignore */ }
  };

  const resolvedRoomId = paramRoomId || storeSession?.roomId;
  const handleBack = () => {
    if (resolvedRoomId) router.replace(`/room/${resolvedRoomId}`);
    else router.replace('/');
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeScreen>
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
            <Trophy size={40} color="#00D397" />
          </div>
          <p className="text-txt font-semibold">Chargement des résultats…</p>
        </div>
      </SafeScreen>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <SafeScreen>
        <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-screen">
          <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center mb-4">
            <BarChart3 size={48} color="#6B7280" />
          </div>
          <p className="text-txt-60 text-center mb-4">Aucun résultat disponible</p>
          <button onClick={handleBack} className="bg-accent px-8 py-4 rounded-2xl hover:bg-accent-d transition-colors">
            <span className="text-btn-fg font-bold">Retour</span>
          </button>
        </div>
      </SafeScreen>
    );
  }

  // ── Derived data ──
  const currentUserRanking = rankings.find(
    (r) => (r.player.userId ?? r.player.id) === user?.id,
  );
  const correctionTotal = currentUserRanking?.corrections?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const totalOwed = currentUserRanking?.debts?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalReceived = currentUserRanking?.debtsReceived?.reduce((sum, d) => sum + d.amount, 0) || 0;
  // Net debt balance: positive = you receive, negative = you owe
  const netDebt = totalReceived - totalOwed;

  // Build team rankings if session is in team mode
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
          color: entry.teamColor ?? '#00D397',
          score: entry.teamScore ?? 0,
          players: [entry],
        });
      }
    });
    teamRankings.push(...Array.from(teamMap.values()).sort((a, b) => b.score - a.score));
  }

  // Build unified debt list from all players' debts (deduplicated by debtor→creditor→category)
  const allDebts = rankings
    .filter((entry) => entry.debts && entry.debts.length > 0)
    .flatMap((entry) =>
      entry.debts.map((debt) => ({
        debtorId: entry.player.userId ?? entry.player.id,
        debtorName: entry.player.name,
        debtorAvatarUrl: entry.player.avatarUrl,
        creditorName: debt.owedTo,
        category: debt.category,
        amount: debt.amount,
      }))
    );

  return (
    <SafeScreen>
      {/* ── Header ── */}
      <div className="flex flex-row items-center px-4 pt-6 pb-4 gap-3">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </button>

        <div className="flex-1">
          <p className="text-txt font-bold text-2xl leading-tight">Résultats</p>
          <p className="text-txt-40 text-xs">Partie #{code}</p>
        </div>

        {resolvedRoomId && (
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-full shrink-0"
            style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
          >
            <span className="text-btn-fg font-bold text-sm">Retourner à la salle</span>
          </button>
        )}

        <div className="shrink-0">
          <Avatar avatarUrl={user?.avatarUrl ?? null} username={user?.username ?? 'U'} size={40} />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto pb-10 flex flex-col gap-3.5 px-4">

        {/* ── Podium ── */}
        <Podium
          rankings={rankings}
          currentUserId={user?.id}
          onPlayerTap={(entry) => {
            const uid = entry.player.userId ?? entry.player.id;
            if (uid) setProfileUserId(uid);
          }}
        />

        {/* ── Performance globale ── */}
        <div className="bg-surface rounded-2xl border border-line p-3.5">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap size={15} className="text-warn" />
            <p className="text-warn text-[10px] font-bold tracking-widest uppercase">
              Performance globale
            </p>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { label: 'JOUEURS', value: rankings.length, color: 'var(--txt)' },
              { label: 'MAX', value: rankings[0]?.finalScore ?? 0, color: '#FFD700' },
              { label: 'POS.', value: currentUserRanking ? `${currentUserRanking.rank}${currentUserRanking.rank === 1 ? 'er' : 'e'}` : '—', color: '#00D397' },
              { label: 'BASE', value: currentUserRanking?.score ?? '—', color: 'var(--txt)' },
              { label: 'CORR.', value: correctionTotal !== 0 ? (correctionTotal > 0 ? `+${correctionTotal}` : correctionTotal) : '0', color: 'var(--txt)' },
              { label: 'DETTES', value: netDebt !== 0 ? (netDebt > 0 ? `+${netDebt}` : `${netDebt}`) : '0', color: netDebt < 0 ? '#D5442F' : netDebt > 0 ? '#00D397' : 'var(--txt)' },
              { label: 'FINAL', value: currentUserRanking?.finalScore ?? '—', color: '#00D397' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <p className="text-txt-40 text-[8.5px] font-bold tracking-wide mb-1">{label}</p>
                <p className="font-display font-semibold text-sm" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Classement par équipe ── */}
        {isTeamMode && teamRankings.length > 0 && (
          <TeamRankingsCard teamRankings={teamRankings} />
        )}

        {/* ── Classement individuel ── */}
        <div className="bg-surface rounded-2xl border border-line overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-accent" />
              <p className="text-accent text-[10px] font-bold tracking-widest uppercase">
                {isTeamMode ? 'Classement individuel' : 'Classement'}
              </p>
            </div>
            <p className="text-txt-40 text-[9.5px] font-bold tracking-widest uppercase">Total points</p>
          </div>

          {rankings.map((entry, index) => {
            const isCurrentUser = (entry.player.userId ?? entry.player.id) === user?.id;
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const scoreColor = index < 3 ? rankColors[index] : 'var(--txt)';
            const playerUserId = entry.player.userId ?? entry.player.id;

            return (
              <button
                key={entry.player.id}
                type="button"
                onClick={() => playerUserId && setProfileUserId(playerUserId)}
                className={`w-full flex flex-row items-center px-4 py-2.5 text-left transition-colors ${
                  index < rankings.length - 1 ? 'border-b border-line' : ''
                } ${isCurrentUser ? 'bg-accent/9' : 'hover:bg-surface-2/40'}`}
              >
                {/* Avatar with rank badge */}
                <div className="relative mr-3">
                  <Avatar
                    avatarUrl={entry.player.avatarUrl}
                    username={entry.player.name}
                    size={40}
                    borderColor={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : undefined}
                  />
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center">
                      <Crown size={10} className="text-btn-fg" />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C0C0C0] flex items-center justify-center">
                      <Medal size={10} className="text-btn-fg" />
                    </div>
                  )}
                  {index === 2 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#CD7F32] flex items-center justify-center">
                      <Medal size={10} className="text-btn-fg" />
                    </div>
                  )}
                </div>

                {/* Name & label */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isCurrentUser ? 'text-accent' : 'text-txt'}`}>
                    {entry.player.name}
                    {isCurrentUser && <span className="text-xs font-normal opacity-60"> (Vous)</span>}
                  </p>
                  <p className="text-txt-40 text-[9.5px] font-bold tracking-wider">
                    {rankLabel(index)}
                  </p>
                </div>

                {/* Friendship */}
                <FriendshipButton
                  status={entry.player.friendshipStatus}
                  isCurrentUser={isCurrentUser}
                  onAddFriend={() => handleAddFriend(entry.player.userId ?? entry.player.id)}
                  size="sm"
                />

                {/* Score */}
                <div className="flex items-baseline gap-1 ml-3">
                  <span className="font-display font-semibold text-lg" style={{ color: scoreColor }}>
                    {entry.finalScore}
                  </span>
                  <span className="text-txt-40 text-[10px]">pts</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Détails par catégorie ── */}
        {categoryRankings && (
          <div className="-mx-4">
            <CategoryRankingsCard categoryRankings={categoryRankings} userId={user?.id || ''} />
          </div>
        )}

        {/* ── Dettes ── */}
        {allDebts.length > 0 && (
          <div className="bg-surface rounded-2xl border border-line overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
              <Zap size={16} className="text-warn" />
              <p className="text-txt font-bold text-xs tracking-widest uppercase flex-1">Dettes</p>
              <div className="w-[22px] h-[22px] rounded-full bg-warn flex items-center justify-center">
                <span className="text-[#11112a] text-[11px] font-bold">{allDebts.length}</span>
              </div>
            </div>

            {allDebts.map((debt, i) => {
              const iOwe = debt.debtorId === user?.id;
              const owedToMe = debt.creditorName === user?.username;
              const accentColor = iOwe ? '#D5442F' : owedToMe ? '#00D397' : '#4A90D9';

              return (
                <div
                  key={i}
                  className={`flex items-center px-4 py-2.5 gap-2.5 ${
                    i < allDebts.length - 1 ? 'border-b border-line' : ''
                  }`}
                  style={{ borderLeft: `3px solid ${accentColor}` }}
                >
                  <Avatar
                    avatarUrl={debt.debtorAvatarUrl ?? null}
                    username={debt.debtorName}
                    size={34}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold">
                      <span className={iOwe ? 'text-buzz' : 'text-txt'}>
                        {debt.debtorId === user?.id ? 'Toi' : debt.debtorName}
                      </span>
                      <span className="text-txt-60"> doit à </span>
                      <span className={owedToMe ? 'text-accent' : 'text-txt'}>
                        {owedToMe ? 'toi' : debt.creditorName}
                      </span>
                    </p>
                    <p className="text-txt-40 text-[10px] uppercase tracking-wider">{debt.category}</p>
                  </div>
                  <span
                    className="font-display font-semibold text-sm shrink-0"
                    style={{ color: iOwe ? '#D5442F' : owedToMe ? '#00D397' : 'var(--txt-60)' }}
                  >
                    {iOwe ? '-' : owedToMe ? '+' : '-'}{debt.amount} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer actions ── */}
        <div className="flex gap-2.5 mt-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-2xl bg-surface border border-line text-txt font-bold text-sm hover:bg-surface-2 transition-colors"
          >
            {resolvedRoomId ? 'Retour à la salle' : 'Quitter'}
          </button>
          {resolvedRoomId && (
            <button
              type="button"
              onClick={() => router.replace(`/session/create?roomId=${resolvedRoomId}`)}
              className="flex-[1.5] py-3.5 rounded-2xl bg-accent text-btn-fg font-bold text-sm hover:bg-accent-d transition-colors"
            >
              Rejouer 🔁
            </button>
          )}
        </div>
      </div>

      <PlayerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </SafeScreen>
  );
}
