'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Users,
  Search,
  X,
  UserPlus,
  UserCheck,
  Clock,
  UserX,
  ChevronRight,
  ChevronLeft,
  Info,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Avatar } from '~/components/ui/Avatar';
import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { useAuthStore } from '~/stores/useAuthStore';
import * as rankingsApi from '~/lib/api/rankings';
import * as friendsApi from '~/lib/api/friends';
import type { GlobalRanking } from '~/types/api';

const PAGE_SIZE = 25;

// ──────────────────────────────────────────────
// Info Modal
// ──────────────────────────────────────────────

function RankingInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1E1A40] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto pb-12 border border-[#3E3666]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#3E3666]">
          <div className="flex items-center gap-2">
            <Trophy size={20} color="#FFD700" />
            <span className="text-white font-bold text-base">Comment fonctionne le classement ?</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors cursor-pointer"
          >
            <X size={16} color="#FFFFFF" />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-white/70 text-sm leading-relaxed">
            Le classement est basé sur un <span className="text-[#9B59B6] font-semibold">Indice de Performance [0–100]</span> indépendant
            du nombre de points par bonne réponse, qui varie selon les sessions.
          </p>

          <p className="text-white/60 text-sm font-medium">Il se compose de 4 critères :</p>

          <div className="space-y-3">
            {/* Criterion 1 */}
            <div className="bg-[#342D5B] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✅</span>
                <span className="text-white font-semibold text-sm">40% — Contribution absolue</span>
              </div>
              <p className="text-white/50 text-xs ml-7">Bonnes réponses / questions jouées</p>
              <p className="text-white/40 text-xs ml-7 mt-0.5">→ Récompense les joueurs qui répondent le plus</p>
            </div>

            {/* Criterion 2 */}
            <div className="bg-[#342D5B] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🏅</span>
                <span className="text-white font-semibold text-sm">30% — Taux de victoires</span>
              </div>
              <p className="text-white/50 text-xs ml-7">Parties gagnées / parties jouées</p>
              <p className="text-white/40 text-xs ml-7 mt-0.5">→ Récompense les joueurs régulièrement premiers</p>
            </div>

            {/* Criterion 3 */}
            <div className="bg-[#342D5B] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎯</span>
                <span className="text-white font-semibold text-sm">20% — Précision de buzz</span>
              </div>
              <p className="text-white/50 text-xs ml-7">Bonnes réponses / buzzers tentés</p>
              <p className="text-white/40 text-xs ml-7 mt-0.5">→ Pénalise les buzzers au hasard</p>
            </div>

            {/* Criterion 4 */}
            <div className="bg-[#342D5B] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📈</span>
                <span className="text-white font-semibold text-sm">10% — Volume de jeu</span>
              </div>
              <p className="text-white/50 text-xs ml-7">Bonus progressif jusqu&apos;à 10 parties jouées</p>
              <p className="text-white/40 text-xs ml-7 mt-0.5">→ Stabilise le classement (min. de parties requises)</p>
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 bg-[#ffffff08] rounded-xl p-3">
            <Info size={14} color="#FFFFFF60" className="mt-0.5 shrink-0" />
            <p className="text-white/50 text-xs leading-relaxed">
              Le score brut (points) est toujours affiché pour information mais n&apos;influe plus sur le rang.
            </p>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Podium (Top 3)
// ──────────────────────────────────────────────

function Podium({ rankings, currentPage }: { rankings: GlobalRanking[]; currentPage: number }) {
  if (currentPage !== 0 || rankings.length < 3) return null;

  const top3 = rankings.slice(0, 3);
  const hasValidUsers = top3.every((r) => r.username);
  if (!hasValidUsers) return null;

  const perf = (r: GlobalRanking) =>
    r.performanceIndex != null ? r.performanceIndex.toFixed(1) : (r.totalScore ?? 0);

  return (
    <div className="flex flex-row justify-center items-end mb-6 mt-4">
      {/* 2nd */}
      <div className="flex flex-col items-center mx-2">
        <div className="mb-2">
          <Avatar avatarUrl={top3[1].avatarUrl} username={top3[1].username || '?'} size={64} borderColor="#C0C0C0" />
        </div>
        <div className="w-20 h-24 bg-[#342D5B] rounded-t-xl flex flex-col items-center justify-end pb-2 border-t-2 border-x-2 border-[#C0C0C0]">
          <Medal size={24} color="#C0C0C0" />
          <span className="text-[#C0C0C0] font-bold mt-1">2</span>
        </div>
        <span className="text-white text-xs mt-1 w-20 text-center truncate">
          {top3[1].username || 'Inconnu'}
        </span>
        <span className="text-[#00D397] text-xs">{perf(top3[1])} score</span>
      </div>

      {/* 1st */}
      <div className="flex flex-col items-center mx-2">
        <div className="relative mb-2">
          <Avatar avatarUrl={top3[0].avatarUrl} username={top3[0].username || '?'} size={80} borderColor="#FFD700" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Crown size={18} color="#FFD700" />
          </div>
        </div>
        <div className="w-24 h-32 bg-[#FFD70020] rounded-t-xl flex flex-col items-center justify-end pb-2 border-t-2 border-x-2 border-[#FFD700]">
          <Crown size={28} color="#FFD700" />
          <span className="text-[#FFD700] font-bold mt-1 text-lg">1</span>
        </div>
        <span className="text-white text-sm font-semibold mt-1 w-24 text-center truncate">
          {top3[0].username || 'Inconnu'}
        </span>
        <span className="text-[#00D397] text-sm font-bold">{perf(top3[0])} score</span>
      </div>

      {/* 3rd */}
      <div className="flex flex-col items-center mx-2">
        <div className="mb-2">
          <Avatar avatarUrl={top3[2].avatarUrl} username={top3[2].username || '?'} size={64} borderColor="#CD7F32" />
        </div>
        <div className="w-20 h-16 bg-[#342D5B] rounded-t-xl flex flex-col items-center justify-end pb-2 border-t-2 border-x-2 border-[#CD7F32]">
          <Medal size={24} color="#CD7F32" />
          <span className="text-[#CD7F32] font-bold mt-1">3</span>
        </div>
        <span className="text-white text-xs mt-1 w-20 text-center truncate">
          {top3[2].username || 'Inconnu'}
        </span>
        <span className="text-[#00D397] text-xs">{perf(top3[2])} score</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Ranking Row
// ──────────────────────────────────────────────

function RankingRow({
  entry,
  isCurrentUser,
  onAddFriend,
}: {
  entry: GlobalRanking;
  isCurrentUser: boolean;
  onAddFriend?: (userId: string, username: string) => void;
}) {
  const router = useRouter();
  const rank = entry.rank ?? 0;

  const getRankIcon = (r: number) => {
    if (r === 1) return <Crown size={20} color="#FFD700" />;
    if (r === 2) return <Medal size={20} color="#C0C0C0" />;
    if (r === 3) return <Medal size={20} color="#CD7F32" />;
    return <span className="text-white/40 font-bold w-6 text-center">{r}</span>;
  };

  const getRankColor = (r: number) => {
    if (r === 1) return 'text-[#FFD700]';
    if (r === 2) return 'text-[#C0C0C0]';
    if (r === 3) return 'text-[#CD7F32]';
    return 'text-white';
  };

  const getFriendshipButton = () => {
    const status = entry.friendshipStatus;
    if (isCurrentUser || status === 'SELF') return null;

    if (status === 'ACCEPTED') {
      return (
        <div className="w-10 h-10 rounded-full bg-[#00D39720] flex items-center justify-center">
          <UserCheck size={18} color="#00D397" />
        </div>
      );
    }
    if (status === 'PENDING') {
      return (
        <div className="w-10 h-10 rounded-full bg-[#F39C1220] flex items-center justify-center">
          <Clock size={18} color="#F39C12" />
        </div>
      );
    }
    if (status === 'DECLINED' || status === 'BLOCKED') {
      return (
        <div className="w-10 h-10 rounded-full bg-[#3E3666] flex items-center justify-center">
          <UserX size={18} color="#FFFFFF40" />
        </div>
      );
    }
    return (
      <button
        onClick={() => onAddFriend?.(entry.userId, entry.username || 'Inconnu')}
        className="w-10 h-10 rounded-full bg-[#00D397] flex items-center justify-center hover:bg-[#00D39730] transition-colors cursor-pointer"
      >
        <UserPlus size={18} color="#00412e" />
      </button>
    );
  };

  const friendshipBtn = getFriendshipButton();

  const perfIndex = entry.performanceIndex;
  const accuracy = entry.globalAccuracyRate != null
    ? Math.round(entry.globalAccuracyRate * 100)
    : null;
  const winRatePct = entry.winRate != null ? Math.round(entry.winRate) : null;
  const correctAnswers = entry.totalCorrectAnswers ?? null;
  const questionsPlayed = entry.totalQuestionsPlayed ?? null;
  const avgCorrect = entry.avgCorrectPerGame != null
    ? entry.avgCorrectPerGame.toFixed(1)
    : null;

  return (
    <div
      onClick={() => router.push(`/profile/${entry.userId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/profile/${entry.userId}`)}
      className={`w-full flex flex-row items-start py-3 border-b border-[#3E3666] text-left hover:bg-[#3E366630] active:bg-[#3E366650] transition-colors cursor-pointer ${
        isCurrentUser ? 'bg-[#00D39710] -mx-4 px-4 w-[calc(100%+32px)]' : ''
      }`}
    >
      {/* Rank icon */}
      <div className="w-8 flex items-center justify-center mt-1 shrink-0">{getRankIcon(rank)}</div>

      {/* Avatar */}
      <div className="mx-2 mt-0.5 shrink-0">
        <Avatar
          avatarUrl={entry.avatarUrl}
          username={entry.username || '?'}
          size={36}
          borderColor={isCurrentUser ? '#00D397' : undefined}
        />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <span className={`font-semibold ${isCurrentUser ? 'text-[#00D397]' : getRankColor(rank)}`}>
          {entry.username || 'Inconnu'}
          {isCurrentUser && ' (Vous)'}
        </span>

        {/* Stats row 1: questions + accuracy */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          {correctAnswers != null && questionsPlayed != null && (
            <div className="flex items-center gap-1">
              <Star size={11} color="#FFFFFF40" />
              <span className="text-white/50 text-xs">{correctAnswers}/{questionsPlayed} questions</span>
            </div>
          )}
          {/* {accuracy != null && (
            <span className="text-white/50 text-xs">Précision {accuracy}%</span>
          )} */}
        </div>

        {/* Stats row 2: games + win rate + avg */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          <span className="text-white/40 text-xs">{entry.totalGames} parties</span>
          {winRatePct != null && (
            <span className="text-white/40 text-xs">{winRatePct}% Victoires</span>
          )}
          {avgCorrect != null && (
            <span className="text-white/40 text-xs">Moy. {avgCorrect} rép./partie</span>
          )}
        </div>
      </div>

      {/* Performance index (primary score) */}
      <div className="flex flex-col items-end mr-2 shrink-0">
        {perfIndex != null ? (
          <>
            <span className="text-[#9B59B6] font-bold">{perfIndex.toFixed(1)}</span>
            <span className="text-white/30 text-xs">indice</span>
          </>
        ) : (
          <>
            <span className="text-white/50 font-bold">{entry.totalScore}</span>
            <span className="text-white/30 text-xs">pts</span>
          </>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        {friendshipBtn}
      </div>

      {!friendshipBtn && (
        <ChevronRight size={16} color="#FFFFFF30" className="mt-1 shrink-0" />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Pagination Controls
// ──────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push('...');
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="flex flex-row items-center justify-center gap-1 mt-4 pb-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="w-9 h-9 rounded-lg bg-[#3E3666] flex items-center justify-center disabled:opacity-30 hover:bg-[#4E4676] transition-colors cursor-pointer disabled:cursor-default"
      >
        <ChevronLeft size={16} color="#FFFFFF" />
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="text-white/40 text-sm px-1">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              p === currentPage
                ? 'bg-[#9B59B6] text-white'
                : 'bg-[#3E3666] text-white/60 hover:bg-[#4E4676]'
            }`}
          >
            {(p as number) + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="w-9 h-9 rounded-lg bg-[#3E3666] flex items-center justify-center disabled:opacity-30 hover:bg-[#4E4676] transition-colors cursor-pointer disabled:cursor-default"
      >
        <ChevronRight size={16} color="#FFFFFF" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function RankingsPage() {
  const [rankings, setRankings] = useState<GlobalRanking[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const user = useAuthStore((state) => state.user);

  const fetchRankings = async (page: number, username?: string) => {
    try {
      const params: rankingsApi.SearchRankingsParams = { page, size: PAGE_SIZE };
      if (username && username.trim()) params.username = username.trim();
      const data = await rankingsApi.getGlobalRankings(params);
      setRankings(data.content);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setCurrentUserRank(data.currentUserRank ?? null);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchRankings(0);
      setIsLoading(false);
    })();
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchUsername(text);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(async () => {
      setIsSearching(true);
      await fetchRankings(0, text);
      setIsSearching(false);
    }, 600);
    setSearchTimer(timer);
  };

  const handleClearSearch = async () => {
    setSearchUsername('');
    setIsSearching(true);
    await fetchRankings(0);
    setIsSearching(false);
  };

  const handlePageChange = async (page: number) => {
    setIsLoading(true);
    await fetchRankings(page, searchUsername);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddFriend = async (targetUserId: string, _username: string) => {
    try {
      await friendsApi.sendFriendRequest(targetUserId);
      await fetchRankings(currentPage, searchUsername);
    } catch {
      // silently handle 409 (already friends)
    }
  };

  if (isLoading) {
    return (
      <SafeScreen className="bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement du classement..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-[#292349]">
      {showInfoModal && <RankingInfoModal onClose={() => setShowInfoModal(false)} />}

      {/* Header */}
      <div className="px-4 pt-4 pb-4 flex items-start justify-between">
        <div>
          <p className="text-white font-bold text-2xl">Classement</p>
          <p className="text-white/60 text-sm">
            {totalElements > 0 ? `${totalElements} joueurs classés` : 'Classement global'}
          </p>
        </div>
        <button
          onClick={() => setShowInfoModal(true)}
          className="mt-1 w-9 h-9 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors cursor-pointer"
          aria-label="Comment fonctionne le classement ?"
        >
          <Info size={18} color="#FFFFFF80" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Podium — only on first page without search */}
        {!searchUsername && currentPage === 0 && rankings.length >= 3 && (
          <Podium rankings={rankings} currentPage={0} />
        )}

        {/* Search */}
        <div className="mb-4">
          <div className="flex flex-row items-center bg-[#342D5B] rounded-xl border border-[#3E3666] px-4">
            <Search size={20} color="#FFFFFF60" />
            <input
              value={searchUsername}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un joueur..."
              className="flex-1 py-3 px-3 bg-transparent text-white focus:outline-none placeholder-white/40"
              autoCapitalize="none"
              autoComplete="off"
            />
            {isSearching && (
              <div className="w-4 h-4 border-2 border-[#9B59B6] border-t-transparent rounded-full animate-spin mr-2" />
            )}
            {searchUsername.length > 0 && !isSearching && (
              <button
                onClick={handleClearSearch}
                className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
              >
                <X size={16} color="#FFFFFF60" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {!searchUsername && totalElements > 0 && (
          <Card className="mb-4">
            <div className="flex flex-row justify-around">
              <div className="flex flex-col items-center">
                <Users size={20} color="#00D397" />
                <span className="text-white font-bold text-lg mt-1">{totalElements}</span>
                <span className="text-white/50 text-xs">Joueurs</span>
              </div>
              <div className="flex flex-col items-center">
                <Trophy size={20} color="#9B59B6" />
                <span className="text-white font-bold text-lg mt-1">
                  {currentUserRank ?? 'N/A'}
                </span>
                <span className="text-white/50 text-xs">Votre rang</span>
              </div>
            </div>
          </Card>
        )}

        {/* Ranking List */}
        <Card>
          <div className="flex flex-row items-center justify-between mb-4">
            <p className="text-white font-bold text-lg">
              {searchUsername ? `Résultats pour "${searchUsername}"` : 'Classement complet'}
            </p>
            {totalPages > 1 && (
              <span className="text-white/40 text-xs">
                Page {currentPage + 1}/{totalPages}
              </span>
            )}
          </div>

          {rankings.length > 0 ? (
            <>
              {rankings.map((entry, index) => (
                <RankingRow
                  key={entry.userId || index}
                  entry={entry}
                  isCurrentUser={entry.userId === user?.id}
                  onAddFriend={handleAddFriend}
                />
              ))}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <p className="text-white/50 text-center py-8">
              {searchUsername
                ? 'Aucun joueur trouvé avec ce nom'
                : 'Aucun classement disponible'}
            </p>
          )}
        </Card>

        <div className="h-8" />
      </div>
    </SafeScreen>
  );
}
