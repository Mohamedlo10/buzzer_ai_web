'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Avatar } from '~/components/shared/Avatar';
import { FriendshipButton } from '~/components/ui/FriendshipButton';
import { UserProfileModal } from '~/components/shared/UserProfileModal';
import { Podium } from '~/components/results/Podium';
import { TeamLeaderboard } from '~/components/game/TeamLeaderboard';
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
  'var(--primary)', 'var(--indigo)', 'var(--violet)', 'var(--warn)', 'var(--bad)',
  'var(--good)', 'var(--gold)', 'var(--accent)',
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
                        style={{ color: isMe ? color : 'var(--txt-60)' }}
                      >
                        {entry.username.split(' ')[0]}
                      </span>
                      <span
                        className="text-xs font-bold shrink-0"
                        style={{ color: isMe ? color : 'var(--txt)' }}
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
export default function SessionResultsPage() {
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

  const handleAddFriend = async (targetUserId: string) => {
    if (!targetUserId || targetUserId === user?.id) return;
    try {
      await friendsApi.sendFriendRequest(targetUserId);
      await loadRankings();
    } catch {
      // ignore
    }
  };

  const resolvedRoomId = paramRoomId || storeSession?.roomId;
  const handleBack = () => {
    if (resolvedRoomId) router.replace(`/room/${resolvedRoomId}`);
    else router.replace('/dashboard');
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeScreen>
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-4 animate-spin">
            <Trophy size={40} className="text-accent" />
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
            <BarChart3 size={48} className="text-txt-40" />
          </div>
          <p className="text-txt-60 text-center mb-4">Aucun résultat disponible</p>
          <button onClick={handleBack} className="bg-accent px-8 py-4 rounded-2xl hover:bg-accent-d transition-colors cursor-pointer">
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
          color: entry.teamColor ?? 'var(--primary)',
          score: entry.teamScore ?? 0,
          players: [entry],
        });
      }
    });
    teamRankings.push(...Array.from(teamMap.values()).sort((a, b) => b.score - a.score));
  }

  // Unified debt list. The server persists one row per applied debt, so every entry
  // here corresponds to points that actually moved — no client-side recomputation.
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

  return (
    <SafeScreen className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden relative bg-transparent">
      {/* ── Header ── */}
      <div className="flex flex-row items-center px-4 pt-4 pb-3 gap-3 bg-bg border-b border-line shrink-0 z-20">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} className="text-txt" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-txt font-bold text-xl leading-tight truncate">Résultats</p>
          <p className="text-txt-40 text-xs truncate">Partie #{code}</p>
        </div>

        {resolvedRoomId && (
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-full shrink-0 bg-accent hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="text-btn-fg font-bold text-xs">Retourner à la salle</span>
          </button>
        )}

        <div className="shrink-0">
          <Avatar avatarUrl={user?.avatarUrl ?? null} name={user?.username ?? 'U'} size={38} />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-28 flex flex-col gap-4 px-4 pt-4">

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
        <div className="bg-surface rounded-2xl border border-line p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap size={15} className="text-warn" />
            <p className="text-warn text-[10px] font-bold tracking-widest uppercase">
              Performance globale
            </p>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { label: 'JOUEURS', value: rankings.length, color: 'var(--txt)' },
              { label: 'MAX', value: rankings[0]?.finalScore ?? 0, color: 'var(--gold)' },
              { label: 'POS.', value: currentUserRanking ? `${currentUserRanking.rank}${currentUserRanking.rank === 1 ? 'er' : 'e'}` : '—', color: 'var(--primary)' },
              { label: 'BASE', value: currentUserRanking?.score ?? '—', color: 'var(--txt)' },
              { label: 'CORR.', value: correctionTotal !== 0 ? (correctionTotal > 0 ? `+${correctionTotal}` : correctionTotal) : '0', color: 'var(--txt)' },
              { label: 'DETTES', value: netDebt !== 0 ? (netDebt > 0 ? `+${netDebt}` : `${netDebt}`) : '0', color: netDebt < 0 ? 'var(--bad)' : netDebt > 0 ? 'var(--primary)' : 'var(--txt)' },
              { label: 'FINAL', value: currentUserRanking?.finalScore ?? '—', color: 'var(--primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center text-center bg-surface-2/60 rounded-xl p-2">
                <p className="text-txt-40 text-[8.5px] font-bold tracking-wide mb-1">{label}</p>
                <p className="font-display font-semibold text-sm" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Classement par équipe ── */}
        {isTeamMode && teamRankings.length > 0 && (
          <TeamLeaderboard
            teams={teamRankings.map((t) => ({
              id: t.id,
              name: t.name,
              color: t.color,
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
            const rankColors = ['var(--gold)', '#C0C0C0', '#CD7F32'];
            const scoreColor = index < 3 ? rankColors[index] : 'var(--txt)';
            const playerUserId = entry.player.userId ?? entry.player.id;

            return (
              <div
                key={entry.player.id}
                onClick={() => playerUserId && setProfileUserId(playerUserId)}
                className={`w-full flex flex-row items-center px-4 py-3 text-left transition-colors cursor-pointer ${
                  index < rankings.length - 1 ? 'border-b border-line' : ''
                } ${isCurrentUser ? 'bg-accent/9' : 'hover:bg-surface-2/40'}`}
              >
                {/* Avatar with rank badge */}
                <div className="relative mr-3 shrink-0">
                  <Avatar
                    avatarUrl={entry.player.avatarUrl}
                    name={entry.player.name}
                    size={38}
                  />
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-bright flex items-center justify-center">
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
                <div className="flex-1 min-w-0 mr-2">
                  <p className={`font-bold text-sm truncate ${isCurrentUser ? 'text-accent' : 'text-txt'}`}>
                    {entry.player.name}
                    {isCurrentUser && <span className="text-xs font-normal opacity-60"> (Vous)</span>}
                  </p>
                  <p className="text-txt-40 text-[9.5px] font-bold tracking-wider uppercase">
                    {rankLabel(index)}
                  </p>
                </div>

                {/* Friendship */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0 mr-3">
                  <FriendshipButton
                    status={entry.player.friendshipStatus}
                    isCurrentUser={isCurrentUser}
                    onAddFriend={() => handleAddFriend(entry.player.userId ?? entry.player.id)}
                    size="sm"
                  />
                </div>

                {/* Score */}
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="font-display font-semibold text-lg" style={{ color: scoreColor }}>
                    {entry.finalScore}
                  </span>
                  <span className="text-txt-40 text-[10px]">pts</span>
                </div>
              </div>
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
                <span className="text-[#1A1410] text-[11px] font-bold">{allDebts.length}</span>
              </div>
            </div>

            {allDebts.map((debt, i) => {
              // Compare on ids: the stored creditor name is a snapshot of the pseudo at
              // sign-up, so matching it against the current username mislabelled the row
              // (and flipped its +/- sign) for anyone who had renamed themselves.
              const iOwe = debt.debtorId === user?.id;
              const owedToMe = debt.creditorId === user?.id;
              const accentColor = iOwe ? 'var(--bad)' : owedToMe ? 'var(--primary)' : 'var(--indigo)';

              return (
                <div
                  key={i}
                  className={`flex items-center px-4 py-3 gap-3 ${
                    i < allDebts.length - 1 ? 'border-b border-line' : ''
                  }`}
                  style={{ borderLeft: `3px solid ${accentColor}` }}
                >
                  <Avatar
                    avatarUrl={debt.debtorAvatarUrl ?? null}
                    name={debt.debtorName}
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
                    style={{ color: iOwe ? 'var(--bad)' : owedToMe ? 'var(--primary)' : 'var(--txt-60)' }}
                  >
                    {iOwe ? '-' : owedToMe ? '+' : '-'}{debt.amount} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer actions ── */}
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-2xl bg-surface border border-line text-txt font-bold text-sm hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Retourner à la salle
          </button>
          {resolvedRoomId && (
            <button
              type="button"
              onClick={() => router.replace(`/session/create?roomId=${resolvedRoomId}`)}
              className="flex-[1.5] py-3.5 rounded-2xl bg-accent text-btn-fg font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Rejouer 🔁
            </button>
          )}
        </div>
      </div>

      <UserProfileModal
        visible={!!profileUserId}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </SafeScreen>
  );
}
