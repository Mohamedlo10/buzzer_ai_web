'use client';

import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Trophy,
  Gamepad2,
  Award,
  Users,
  Clock,
  BarChart3,
  UserPlus,
  UserCheck,
  UserX,
  Target,
  Star,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { SafeScreen } from '~/components/layout/SafeScreen';
import * as friendsApi from '~/lib/api/friends';
import { useFriendStore } from '~/stores/useFriendStore';
import type { FriendshipStatus } from '~/types/api';

// Status configuration for friendship button
const FRIENDSHIP_CONFIG: Record<
  FriendshipStatus,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ size: number; color: string }> }
> = {
  SELF:     { label: 'Vous',           color: '#6B7280', bgColor: '#6B728020', icon: User },
  NONE:     { label: 'Ajouter',        color: '#00D397', bgColor: '#00D39720', icon: UserPlus },
  PENDING:  { label: 'En attente',     color: '#F39C12', bgColor: '#F39C1220', icon: Clock },
  ACCEPTED: { label: 'Ami',            color: '#00D397', bgColor: '#00D39720', icon: UserCheck },
  DECLINED: { label: 'Refusé',         color: '#6B7280', bgColor: '#6B728020', icon: UserX },
  BLOCKED:  { label: 'Bloqué',         color: '#EF4444', bgColor: '#EF444420', icon: UserX },
};

export default function FriendProfilePage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const { sendRequest, removeFriend } = useFriendStore();

  // Fetch friend profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['friendProfile', userId],
    queryFn: () => friendsApi.getFriendProfile(userId),
    enabled: !!userId,
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: () => sendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: () => removeFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleFriendAction = () => {
    if (!profile?.friendshipStatus) return;
    const status = profile.friendshipStatus;
    if (status === 'NONE') {
      sendRequestMutation.mutate();
    } else if (status === 'ACCEPTED') {
      removeFriendMutation.mutate();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center px-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <UserX size={32} color="#EF4444" />
          </div>
          <p className="text-white text-xl font-bold mb-2">Profil non trouvé</p>
          <p className="text-white/60 text-center mb-6">
            Impossible de charger les informations de cet utilisateur.
          </p>
          <button
            onClick={handleBack}
            className="bg-[#342D5B] px-6 py-3 rounded-xl border border-[#3E3666] hover:bg-[#3E3666] transition-colors"
          >
            <span className="text-white font-semibold">Retour</span>
          </button>
        </div>
      </div>
    );
  }

  const friendshipStatus = profile.friendshipStatus || 'NONE';
  const friendshipConfig = FRIENDSHIP_CONFIG[friendshipStatus];
  const FriendshipIcon = friendshipConfig.icon;

  const winRate = profile.winRate != null
    ? Math.round(profile.winRate)
    : profile.totalGames > 0
      ? Math.round((profile.totalWins / profile.totalGames) * 100)
      : 0;
  const perfIndex = profile.performanceIndex ?? null;
  const accuracy = profile.globalAccuracyRate != null
    ? Math.round(profile.globalAccuracyRate * 100)
    : null;
  const correctAnswers = profile.totalCorrectAnswers ?? null;
  const questionsPlayed = profile.totalQuestionsPlayed ?? null;

  const isMutating = sendRequestMutation.isPending || removeFriendMutation.isPending;

  return (
    <div className="min-h-screen bg-[#292349]">
      <div className="overflow-y-auto py-10">
        {/* Header with back button */}
        <div className="flex items-center px-4 pt-6 pb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center border border-[#3E3666] hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <p className="text-white text-lg font-semibold ml-4">Profil</p>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col items-center px-6 pb-6">
          {/* Avatar */}
          <div
            className="w-28 h-28 rounded-full overflow-hidden mb-4"
            style={{ boxShadow: '0 0 20px rgba(139,92,246,0.5)' }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                className="w-28 h-28 rounded-full object-cover"
                alt={profile.username}
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
              >
                <span className="text-white text-4xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Username */}
          <p className="text-white text-2xl font-bold mb-2">{profile.username}</p>

          {/* Global Rank Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="px-4 py-2 rounded-full bg-yellow-500/20 flex items-center gap-2">
              <Trophy size={14} color="#F59E0B" />
              <span className="text-yellow-500 font-semibold text-sm">
                Rang #{profile.globalRank > 0 ? profile.globalRank : '-'}
              </span>
            </div>
          </div>

          {/* Friendship Action Button */}
          {friendshipStatus !== 'SELF' &&
            friendshipStatus !== 'PENDING' &&
            friendshipStatus !== 'DECLINED' &&
            friendshipStatus !== 'BLOCKED' && (
              <button
                onClick={handleFriendAction}
                disabled={isMutating}
                className="flex items-center gap-2 px-6 py-3 rounded-full hover:opacity-80 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: friendshipConfig.bgColor }}
              >
                {isMutating ? (
                  <div
                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: friendshipConfig.color }}
                  />
                ) : (
                  <>
                    <FriendshipIcon size={18} color={friendshipConfig.color} />
                    <span className="font-semibold" style={{ color: friendshipConfig.color }}>
                      {friendshipStatus === 'ACCEPTED' ? 'Retirer des amis' : friendshipConfig.label}
                    </span>
                  </>
                )}
              </button>
            )}

          {friendshipStatus === 'PENDING' && (
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#F39C1220]">
              <Clock size={18} color="#F39C12" />
              <span className="font-semibold text-[#F39C12]">Demande en attente</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="px-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {/* Performance Index */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#9B59B620] flex items-center justify-center">
                  <BarChart3 size={20} color="#9B59B6" />
                </div>
                <span className="text-[#9B59B6] text-xl font-bold">
                  {perfIndex != null ? perfIndex.toFixed(1) : '-'}
                </span>
              </div>
              <p className="text-white/60 text-sm">Indice de perf.</p>
              {perfIndex != null && (
                <div className="mt-2 h-1.5 bg-[#292349] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#9B59B6]"
                    style={{ width: `${Math.min(100, Math.max(0, perfIndex))}%` }}
                  />
                </div>
              )}
            </div>

            {/* Games Played */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Gamepad2 size={20} color="#10B981" />
                </div>
                <span className="text-green-500 text-xl font-bold">{profile.totalGames}</span>
              </div>
              <p className="text-white/60 text-sm">Parties jouées</p>
            </div>

            {/* Wins */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Trophy size={20} color="#F59E0B" />
                </div>
                <span className="text-yellow-500 text-xl font-bold">{profile.totalWins}</span>
              </div>
              <p className="text-white/60 text-sm">Victoires</p>
              <p className="text-white/40 text-xs mt-0.5">{winRate}% taux</p>
            </div>

            {/* Best Score */}
            <div className="flex-1 min-w-[45%] bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Award size={20} color="#8B5CF6" />
                </div>
                <span className="text-purple-500 text-xl font-bold">
                  {profile.bestScore.toLocaleString()}
                </span>
              </div>
              <p className="text-white/60 text-sm">Meilleur score</p>
            </div>
          </div>
        </div>

        {/* Accuracy / Questions card */}
        <div className="px-4 mb-6">
          <div className="bg-[#342D5B] rounded-2xl p-5 border border-[#3E3666]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Target size={24} color="#06B6D4" />
                </div>
                <div>
                  <p className="text-white text-xl font-bold">
                    {accuracy != null ? `${accuracy}%` : '-'}
                  </p>
                  <p className="text-white/60 text-sm">Précision de buzz</p>
                </div>
              </div>
              {correctAnswers != null && questionsPlayed != null && (
                <div className="flex items-center gap-1 text-right">
                  <Star size={14} color="#FFFFFF40" />
                  <span className="text-white/50 text-sm">{correctAnswers}/{questionsPlayed}</span>
                </div>
              )}
            </div>
            {accuracy != null && (
              <div className="h-2 bg-[#292349] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            )}
            {/* Score brut en secondaire */}
            <p className="text-white/30 text-xs mt-3">
              Score brut (informatif) : {profile.totalScore.toLocaleString()} pts
            </p>
          </div>
        </div>

        {/* Top Categories */}
        {profile.topCategories && profile.topCategories.length > 0 && (
          <div className="px-4 mb-6">
            <p className="text-white/60 text-sm font-semibold mb-3 px-1 uppercase tracking-wider">
              Catégories Favorites
            </p>
            <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
              {profile.topCategories.slice(0, 5).map((category, index) => (
                <div
                  key={category.category}
                  className={`flex items-center p-4 ${
                    index < profile.topCategories.length - 1 ? 'border-b border-[#3E3666]' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#292349] flex items-center justify-center mr-3">
                    <span className="text-white/60 text-sm font-bold">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium capitalize">
                      {category.category.toLowerCase()}
                    </p>
                    <p className="text-white/50 text-sm">
                      {category.gamesPlayed} parties • {category.winRate}% victoires
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-500 font-semibold">
                      {category.totalScore.toLocaleString()}
                    </p>
                    <p className="text-white/40 text-xs">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Games */}
        {profile.recentGames && profile.recentGames.length > 0 && (
          <div className="px-4 mb-6">
            <p className="text-white/60 text-sm font-semibold mb-3 px-1 uppercase tracking-wider">
              Parties Récentes
            </p>
            <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
              {profile.recentGames.map((game, index) => (
                <div
                  key={game.sessionId}
                  className={`flex items-center p-4 ${
                    index < profile.recentGames.length - 1 ? 'border-b border-[#3E3666]' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mr-4">
                    <Trophy size={20} color="#8B5CF6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-base font-medium">
                      Session #{game.sessionCode}
                    </p>
                    <p className="text-white/60 text-sm">
                      {game.roomName || 'Partie publique'} •{' '}
                      {new Date(game.endedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${game.rank === 1 ? 'text-yellow-500' : 'text-white/80'}`}>
                      {game.rank === 1 ? '🏆 ' : ''}{game.score} pts
                    </p>
                    <p className="text-white/40 text-xs">
                      #{game.rank}/{game.totalPlayers}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room Stats */}
        <div className="px-4 pb-10">
          <p className="text-white/60 text-sm font-semibold mb-3 px-1 uppercase tracking-wider">
            Statistiques Salons
          </p>
          <div className="bg-[#342D5B] rounded-2xl p-5 border border-[#3E3666]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Users size={24} color="#F97316" />
                </div>
                <div>
                  <p className="text-white text-xl font-bold">{profile.totalRooms}</p>
                  <p className="text-white/60 text-sm">Salons rejoints</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-500 text-lg font-semibold">{profile.totalRoomWins}</p>
                <p className="text-white/40 text-xs">victoires en salon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
