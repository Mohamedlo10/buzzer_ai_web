'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  UserCheck,
  Clock,
  UserX,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Avatar } from '~/components/ui/Avatar';
import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { useAuthStore } from '~/stores/useAuthStore';
import * as rankingsApi from '~/lib/api/rankings';
import * as friendsApi from '~/lib/api/friends';
import type { GlobalRanking, GlobalRankingPaginatedResponse } from '~/types/api';

const PAGE_SIZE = 6;

// ──────────────────────────────────────────────
// Podium (Top 3)
// ──────────────────────────────────────────────

function Podium({ rankings, currentPage }: { rankings: GlobalRanking[]; currentPage: number }) {
  if (currentPage !== 0 || rankings.length < 3) return null;

  const top3 = rankings.slice(0, 3);
  const hasValidUsers = top3.every((r) => r.username);
  if (!hasValidUsers) return null;

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
        <span className="text-[#00D397] text-xs">{top3[1].totalScore} pts</span>
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
        <span className="text-[#00D397] text-sm font-bold">{top3[0].totalScore || 0} pts</span>
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
        <span className="text-[#00D397] text-xs">{top3[2].totalScore || 0} pts</span>
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

  return (
    <div
      className={`flex flex-row items-center py-3 border-b border-[#3E3666] ${
        isCurrentUser ? 'bg-[#00D39710] -mx-4 px-4' : ''
      }`}
    >
      <div className="w-8 flex items-center justify-center">{getRankIcon(rank)}</div>

      <div className="mx-2">
        <Avatar
          avatarUrl={entry.avatarUrl}
          username={entry.username || '?'}
          size={36}
          borderColor={isCurrentUser ? '#00D397' : undefined}
        />
      </div>

      <div className="flex-1">
        <span
          className={`font-semibold ${isCurrentUser ? 'text-[#00D397]' : getRankColor(rank)}`}
        >
          {entry.username || 'Inconnu'}
          {isCurrentUser && ' (Vous)'}
        </span>
        <div className="flex flex-row items-center mt-0.5">
          <Star size={12} color="#FFFFFF40" />
          <span className="text-white/50 text-xs ml-1">{entry.totalGames} parties</span>
          {entry.avgScore > 0 && (
            <>
              <span className="text-white/30 mx-2">•</span>
              <span className="text-white/50 text-xs">{Math.round(entry.avgScore)} pts/moy</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end mr-3">
        <span className="text-white font-bold">{entry.totalScore}</span>
        <span className="text-white/40 text-xs">pts</span>
      </div>

      {getFriendshipButton()}
    </div>
  );
}

// ──────────────────────────────────────────────
// Pagination Controls
// ──────────────────────────────────────────────

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const maxVisible = 5;
  let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(0, endPage - maxVisible + 1);
  }
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={`w-10 h-10 rounded-xl flex items-center justify-center mr-2 transition-opacity cursor-pointer ${
          currentPage === 0 ? 'bg-[#3E3666] cursor-not-allowed' : 'bg-[#9B59B6] hover:opacity-90'
        }`}
      >
        <ChevronLeft size={20} color={currentPage === 0 ? '#FFFFFF40' : '#FFFFFF'} />
      </button>

      <div className="flex flex-row items-center px-2">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-0.5 transition-colors cursor-pointer ${
              currentPage === page ? 'bg-[#9B59B6]' : 'bg-[#3E3666] hover:opacity-80'
            }`}
          >
            <span className={currentPage === page ? 'text-white font-bold' : 'text-white/60'}>
              {page + 1}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className={`w-10 h-10 rounded-xl flex items-center justify-center ml-2 transition-opacity cursor-pointer ${
          currentPage >= totalPages - 1
            ? 'bg-[#3E3666] cursor-not-allowed'
            : 'bg-[#9B59B6] hover:opacity-90'
        }`}
      >
        <ChevronRight size={20} color={currentPage >= totalPages - 1 ? '#FFFFFF40' : '#FFFFFF'} />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function RankingsPage() {
  const [pageData, setPageData] = useState<GlobalRankingPaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const user = useAuthStore((state) => state.user);

  const fetchRankings = async (page: number, username?: string) => {
    try {
      const params: rankingsApi.SearchRankingsParams = { page, size: PAGE_SIZE };
      if (username && username.trim()) {
        params.username = username.trim();
      }
      const data = await rankingsApi.getGlobalRankings(params);
      setPageData(data);
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
    setIsSearching(true);
    await fetchRankings(page, searchUsername);
    setIsSearching(false);
  };

  const handleAddFriend = async (targetUserId: string, _username: string) => {
    try {
      await friendsApi.sendFriendRequest(targetUserId);
      await fetchRankings(currentPage, searchUsername);
    } catch (err: any) {
      // silently handle 409 (already friends)
    }
  };

  const rankings = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const totalElements = pageData?.totalElements ?? 0;

  if (isLoading) {
    return (
      <SafeScreen className="bg-[#292349] flex items-center justify-center">
        <Spinner text="Chargement du classement..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="px-4 pt-20 pb-4">
        <p className="text-white font-bold text-2xl">Classement</p>
        <p className="text-white/60 text-sm">
          {totalElements > 0 ? `${totalElements} joueurs classés` : 'Classement global'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Search by Username */}
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

        {/* Podium — only on first page without search */}
        {!searchUsername && (
          <Podium rankings={rankings} currentPage={currentPage} />
        )}

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
                  {pageData?.currentUserRank ?? 'N/A'}
                </span>
                <span className="text-white/50 text-xs">Votre rang</span>
              </div>
            </div>
          </Card>
        )}

        {/* Ranking List */}
        <Card>
          <p className="text-white font-bold text-lg mb-4">
            {searchUsername ? `Résultats pour "${searchUsername}"` : 'Classement complet'}
          </p>

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

              <PaginationControls
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
