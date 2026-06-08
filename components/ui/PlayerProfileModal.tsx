'use client';

import { useEffect, useState } from 'react';
import {
  X,
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

import * as friendsApi from '~/lib/api/friends';
import { useFriendStore } from '~/stores/useFriendStore';
import type { FriendshipStatus } from '~/types/api';

const FRIENDSHIP_CONFIG: Record<
  FriendshipStatus,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ size: number; color: string }> }
> = {
  SELF:     { label: 'Vous',       color: 'var(--txt-40)', bgColor: 'var(--surface-2)',                              icon: UserX },
  NONE:     { label: 'Ajouter',    color: '#00D397',       bgColor: 'color-mix(in oklab, #00D397 15%, transparent)', icon: UserPlus },
  PENDING:  { label: 'En attente', color: '#F59E0B',       bgColor: 'color-mix(in oklab, #F59E0B 15%, transparent)', icon: Clock },
  ACCEPTED: { label: 'Retirer des amis', color: '#00D397', bgColor: 'color-mix(in oklab, #00D397 15%, transparent)', icon: UserCheck },
  DECLINED: { label: 'Refusé',     color: 'var(--txt-40)', bgColor: 'var(--surface-2)',                              icon: UserX },
  BLOCKED:  { label: 'Bloqué',     color: '#D5442F',       bgColor: 'color-mix(in oklab, #D5442F 15%, transparent)', icon: UserX },
};

interface PlayerProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

export function PlayerProfileModal({ userId, onClose }: PlayerProfileModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const queryClient = useQueryClient();
  const { sendRequest, removeFriend } = useFriendStore();

  const isOpen = !!userId;

  // Reset closing state whenever a new user is opened
  useEffect(() => {
    if (userId) setIsClosing(false);
  }, [userId]);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['friendProfile', userId],
    queryFn: () => friendsApi.getFriendProfile(userId as string),
    enabled: !!userId,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => sendRequest(userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: () => removeFriend(userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
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

  if (!isOpen) return null;

  const friendshipStatus = profile?.friendshipStatus || 'NONE';
  const friendshipConfig = FRIENDSHIP_CONFIG[friendshipStatus];
  const FriendshipIcon = friendshipConfig.icon;
  const isMutating = sendRequestMutation.isPending || removeFriendMutation.isPending;

  const winRate = profile
    ? profile.winRate != null
      ? Math.round(profile.winRate)
      : profile.totalGames > 0
        ? Math.round((profile.totalWins / profile.totalGames) * 100)
        : 0
    : 0;
  const perfIndex = profile?.performanceIndex ?? null;
  const accuracy = profile?.globalAccuracyRate != null
    ? Math.round(profile.globalAccuracyRate * 100)
    : null;
  const correctAnswers = profile?.totalCorrectAnswers ?? null;
  const questionsPlayed = profile?.totalQuestionsPlayed ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Scrim */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-scrim backdrop-blur-sm ${isClosing ? 'animate-scrimout' : 'animate-scrimin'}`}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-lg max-h-[88vh] bg-surface rounded-t-3xl border-t border-line overflow-hidden flex flex-col ${
          isClosing ? 'animate-sheetdown' : 'animate-sheetup'
        }`}
      >
        {/* Drag handle + close */}
        <div className="relative flex items-center justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-surface-2" />
          <button
            onClick={handleClose}
            className="absolute right-4 top-3 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <X size={16} className="text-txt-60" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-8">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-host border-t-transparent rounded-full animate-spin" />
              <p className="text-txt-60">Chargement du profil...</p>
            </div>
          )}

          {!isLoading && (error || !profile) && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-buzz/15 flex items-center justify-center mb-4">
                <UserX size={32} className="text-buzz" />
              </div>
              <p className="text-txt text-lg font-bold mb-2">Profil non trouvé</p>
              <p className="text-txt-60 text-center text-sm">
                Impossible de charger les informations de cet utilisateur.
              </p>
            </div>
          )}

          {!isLoading && profile && (
            <>
              {/* Header */}
              <div className="flex flex-col items-center pb-6">
                <div
                  className="w-[84px] h-[84px] rounded-full overflow-hidden mb-3"
                  style={{ boxShadow: '0 0 20px rgba(139,92,246,0.5)' }}
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      className="w-[84px] h-[84px] rounded-full object-cover"
                      alt={profile.username}
                    />
                  ) : (
                    <div
                      className="w-[84px] h-[84px] rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #4A90D9)' }}
                    >
                      <span className="text-txt text-3xl font-bold">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-txt text-xl font-bold font-display mb-2">{profile.username}</p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1.5 rounded-full bg-energy/15 flex items-center gap-1.5">
                    <Trophy size={13} className="text-energy" />
                    <span className="text-energy font-semibold text-sm">
                      Rang #{profile.globalRank > 0 ? profile.globalRank : '-'}
                    </span>
                  </div>
                </div>

                {friendshipStatus !== 'SELF' &&
                  friendshipStatus !== 'PENDING' &&
                  friendshipStatus !== 'DECLINED' &&
                  friendshipStatus !== 'BLOCKED' && (
                    <button
                      onClick={handleFriendAction}
                      disabled={isMutating}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full hover:opacity-80 disabled:opacity-50 transition-opacity cursor-pointer"
                      style={{ backgroundColor: friendshipConfig.bgColor }}
                    >
                      {isMutating ? (
                        <div
                          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: friendshipConfig.color }}
                        />
                      ) : (
                        <>
                          <FriendshipIcon size={16} color={friendshipConfig.color} />
                          <span className="font-semibold text-sm" style={{ color: friendshipConfig.color }}>
                            {friendshipStatus === 'ACCEPTED' ? 'Retirer des amis' : friendshipConfig.label}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                {friendshipStatus === 'PENDING' && (
                  <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-warn/15">
                    <Clock size={16} className="text-warn" />
                    <span className="font-semibold text-sm text-warn">Demande en attente</span>
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex-1 min-w-[45%] bg-surface-2 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-host/15 flex items-center justify-center">
                      <BarChart3 size={18} className="text-host" />
                    </div>
                    <span className="text-host text-lg font-bold font-display">
                      {perfIndex != null ? perfIndex.toFixed(1) : '-'}
                    </span>
                  </div>
                  <p className="text-txt-60 text-sm">Indice de perf.</p>
                  {perfIndex != null && (
                    <div className="mt-2 h-1.5 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-host"
                        style={{ width: `${Math.min(100, Math.max(0, perfIndex))}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-[45%] bg-surface-2 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                      <Gamepad2 size={18} className="text-accent" />
                    </div>
                    <span className="text-accent text-lg font-bold font-display">{profile.totalGames}</span>
                  </div>
                  <p className="text-txt-60 text-sm">Parties jouées</p>
                </div>

                <div className="flex-1 min-w-[45%] bg-surface-2 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-energy/15 flex items-center justify-center">
                      <Trophy size={18} className="text-energy" />
                    </div>
                    <span className="text-energy text-lg font-bold font-display">{profile.totalWins}</span>
                  </div>
                  <p className="text-txt-60 text-sm">Victoires</p>
                  <p className="text-txt-40 text-xs mt-0.5">{winRate}% taux</p>
                </div>

                <div className="flex-1 min-w-[45%] bg-surface-2 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-host/15 flex items-center justify-center">
                      <Award size={18} className="text-host" />
                    </div>
                    <span className="text-host text-lg font-bold font-display">
                      {profile.bestScore.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-txt-60 text-sm">Meilleur score</p>
                </div>
              </div>

              {/* Accuracy */}
              <div className="bg-surface-2 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-team/15 flex items-center justify-center">
                      <Target size={20} className="text-team" />
                    </div>
                    <div>
                      <p className="text-txt text-lg font-bold font-display">
                        {accuracy != null ? `${accuracy}%` : '-'}
                      </p>
                      <p className="text-txt-60 text-sm">Précision de buzz</p>
                    </div>
                  </div>
                  {correctAnswers != null && questionsPlayed != null && (
                    <div className="flex items-center gap-1 text-right">
                      <Star size={13} className="text-txt-40" />
                      <span className="text-txt-60 text-sm">{correctAnswers}/{questionsPlayed}</span>
                    </div>
                  )}
                </div>
                {accuracy != null && (
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-team" style={{ width: `${accuracy}%` }} />
                  </div>
                )}
              </div>

              {/* Top categories */}
              {profile.topCategories && profile.topCategories.length > 0 && (
                <div className="mb-4">
                  <p className="text-txt-60 text-sm font-semibold mb-2 px-1 uppercase tracking-wider">
                    Catégories Favorites
                  </p>
                  <div className="bg-surface-2 rounded-2xl overflow-hidden">
                    {profile.topCategories.slice(0, 3).map((category, index) => (
                      <div
                        key={category.category}
                        className={`flex items-center p-3 ${
                          index < Math.min(3, profile.topCategories.length) - 1 ? 'border-b border-line' : ''
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-bg flex items-center justify-center mr-3">
                          <span className="text-txt-60 text-xs font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-txt font-medium capitalize text-sm">
                            {category.category.toLowerCase()}
                          </p>
                          <p className="text-txt-60 text-xs">
                            {category.gamesPlayed} parties • {category.winRate}% victoires
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-team font-semibold text-sm">
                            {category.totalScore.toLocaleString()}
                          </p>
                          <p className="text-txt-40 text-xs">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent games */}
              {profile.recentGames && profile.recentGames.length > 0 && (
                <div className="mb-4">
                  <p className="text-txt-60 text-sm font-semibold mb-2 px-1 uppercase tracking-wider">
                    Parties Récentes
                  </p>
                  <div className="bg-surface-2 rounded-2xl overflow-hidden">
                    {profile.recentGames.slice(0, 5).map((game, index) => (
                      <div
                        key={game.sessionId}
                        className={`flex items-center p-3 ${
                          index < Math.min(5, profile.recentGames.length) - 1 ? 'border-b border-line' : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-host/15 flex items-center justify-center mr-3">
                          <Trophy size={16} className="text-host" />
                        </div>
                        <div className="flex-1">
                          <p className="text-txt text-sm font-medium">
                            Session #{game.sessionCode}
                          </p>
                          <p className="text-txt-60 text-xs">
                            {game.roomName || 'Partie publique'} •{' '}
                            {new Date(game.endedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${game.rank === 1 ? 'text-energy' : 'text-txt-60'}`}>
                            {game.rank === 1 ? '🏆 ' : ''}{game.score} pts
                          </p>
                          <p className="text-txt-40 text-xs">
                            #{game.rank}/{game.totalPlayers}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room stats */}
              <div>
                <p className="text-txt-60 text-sm font-semibold mb-2 px-1 uppercase tracking-wider">
                  Statistiques Salons
                </p>
                <div className="bg-surface-2 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-warn/15 flex items-center justify-center">
                      <Users size={20} className="text-warn" />
                    </div>
                    <div>
                      <p className="text-txt text-lg font-bold font-display">{profile.totalRooms}</p>
                      <p className="text-txt-60 text-sm">Salons rejoints</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-warn text-base font-semibold">{profile.totalRoomWins}</p>
                    <p className="text-txt-40 text-xs">victoires en salon</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
