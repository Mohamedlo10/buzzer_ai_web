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
      <p className="text-white/50 text-xs font-bold tracking-widest uppercase px-4 mb-3">
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
              className="flex-shrink-0 bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4"
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
      <SafeScreen className="bg-[#292349]">
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
            <Trophy size={40} color="#00D397" />
          </div>
          <p className="text-white font-semibold">Chargement des résultats...</p>
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
          <button onClick={handleBack} className="bg-[#00D397] px-8 py-4 rounded-2xl">
            <span className="text-[#292349] font-bold">Retour</span>
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
    <SafeScreen className="bg-[#292349]">
      {/* ── Header ── */}
      <div className="flex flex-row items-center px-4 pt-6 pb-4 gap-3">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </button>

        <div className="flex-1">
          <p className="text-white font-bold text-2xl leading-tight">Résultats</p>
          <p className="text-white/40 text-xs">Partie #{code}</p>
        </div>

        {resolvedRoomId && (
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-full shrink-0"
            style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
          >
            <span className="text-[#292349] font-bold text-sm">Retourner à la salle</span>
          </button>
        )}

        <div className="shrink-0">
          <Avatar avatarUrl={user?.avatarUrl ?? null} username={user?.username ?? 'U'} size={40} />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto pb-10 flex flex-col gap-4 px-4">

        {/* ── Performance Globale & Détails ── */}
        <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} color="#F59E0B" />
            <p className="text-white/60 text-xs font-bold tracking-widest uppercase">
              Performance Globale &amp; Détails
            </p>
          </div>

          <div className="flex flex-row justify-between">
            {[
              { label: 'JOUEURS', value: rankings.length, color: '#FFFFFF' },
              { label: 'MAX', value: rankings[0]?.finalScore ?? 0, color: '#F59E0B' },
              { label: 'POS.', value: currentUserRanking ? `${currentUserRanking.rank}er` : '—', color: '#00D397' },
              { label: 'BASE', value: currentUserRanking?.score ?? '—', color: '#FFFFFF' },
              { label: 'CORR.', value: correctionTotal !== 0 ? (correctionTotal > 0 ? `+${correctionTotal}` : correctionTotal) : '0', color: '#FFFFFF' },
              { label: 'DETTES', value: netDebt !== 0 ? (netDebt > 0 ? `+${netDebt}` : `${netDebt}`) : '0', color: netDebt < 0 ? '#EF4444' : netDebt > 0 ? '#00D397' : '#FFFFFF' },
              { label: 'FINAL', value: currentUserRanking?.finalScore ?? '—', color: '#00D397' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center">
                <p className="text-white/40 text-[10px] font-bold tracking-wider mb-1">{label}</p>
                <p className="font-bold md:text-base text-sm" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Classement ── */}
        <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3E3666]">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} color="#00D397" />
              <p className="text-white/60 font-bold text-xs tracking-widest uppercase">Classement</p>
            </div>
            <p className="text-white/30 text-xs font-semibold tracking-wider uppercase">Total points</p>
          </div>

          {rankings.map((entry, index) => {
            const isCurrentUser = (entry.player.userId ?? entry.player.id) === user?.id;
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            const scoreColor = index < 3 ? rankColors[index] : '#FFFFFF';

            return (
              <div
                key={entry.player.id}
                className={`flex flex-row items-center px-4 py-3 ${
                  index < rankings.length - 1 ? 'border-b border-[#3E3666]' : ''
                } ${isCurrentUser ? 'bg-[#00D39710]' : ''}`}
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
                      <Crown size={10} color="#292349" />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C0C0C0] flex items-center justify-center">
                      <Medal size={10} color="#292349" />
                    </div>
                  )}
                  {index === 2 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#CD7F32] flex items-center justify-center">
                      <Medal size={10} color="#292349" />
                    </div>
                  )}
                </div>

                {/* Name & label */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold md:text-base text-sm truncate ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}>
                    {entry.player.name}
                    {isCurrentUser && <span className="text-xs font-normal opacity-60"> (Vous)</span>}
                  </p>
                  <p className="text-white/30 text-xs font-semibold tracking-wider">
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
                  <span className="font-bold text-base md:text-xl" style={{ color: scoreColor }}>
                    {entry.finalScore}
                  </span>
                  <span className="text-white/30 text-xs">pts</span>
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
          <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#3E3666]">
              <Zap size={16} color="#F59E0B" />
              <p className="text-white font-bold text-sm tracking-widest uppercase flex-1">Dettes</p>
              <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center">
                <span className="text-[#292349] text-xs font-bold">{allDebts.length}</span>
              </div>
            </div>

            {allDebts.map((debt, i) => {
              const iOwe = debt.debtorId === user?.id;
              const owedToMe = debt.creditorName === user?.username;
              const accentColor = iOwe ? '#EF4444' : owedToMe ? '#00D397' : '#4A90D9';
              const amountStr = iOwe
                ? `-${debt.amount} pts`
                : owedToMe
                ? `+${debt.amount} pts`
                : `-${debt.amount} pts`;
              const amountColor = iOwe ? '#EF4444' : owedToMe ? '#00D397' : '#FFFFFF80';

              return (
                <div
                  key={i}
                  className={`flex items-center px-4 py-3 gap-3 ${
                    i < allDebts.length - 1 ? 'border-b border-[#3E3666]' : ''
                  }`}
                  style={{ borderLeft: `3px solid ${accentColor}` }}
                >
                  <Avatar
                    avatarUrl={debt.debtorAvatarUrl ?? null}
                    username={debt.debtorName}
                    size={36}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      <span style={{ color: iOwe ? '#EF4444' : '#FFFFFF' }}>{debt.debtorName}</span>
                      <span className="text-white/40"> doit à </span>
                      <span style={{ color: owedToMe ? '#00D397' : '#FFFFFF' }}>{debt.creditorName}</span>
                    </p>
                    <p className="text-white/30 text-xs uppercase tracking-wider">{debt.category}</p>
                  </div>
                  <span className="font-bold text-sm shrink-0" style={{ color: amountColor }}>
                    {amountStr}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Back to dashboard ── */}
        {!resolvedRoomId && (
          <button
            onClick={handleBack}
            className="w-full py-4 rounded-2xl flex items-center justify-center mt-2"
            style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
          >
            <span className="text-[#292349] font-bold text-lg">Retour à l'accueil</span>
          </button>
        )}
      </div>
    </SafeScreen>
  );
}
