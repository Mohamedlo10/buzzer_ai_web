'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Swords, Sparkles, UserPlus, UserCheck, Clock, Flame } from 'lucide-react';
import { Avatar } from './Avatar';
import * as friendsApi from '~/lib/api/friends';
import { useAuthStore } from '~/stores/useAuthStore';
import type { UserStatsResponse, FriendshipStatus, CategoryStat } from '~/types/api';

interface UserProfileModalProps {
  userId: string | null;
  username?: string;
  avatarUrl?: string | null;
  score?: number;
  rank?: number;
  gamesPlayed?: number;
  visible: boolean;
  onClose: () => void;
}

export function UserProfileModal({
  userId,
  username: initialUsername = 'Joueur',
  avatarUrl: initialAvatarUrl,
  score: initialScore = 0,
  rank: initialRank,
  gamesPlayed: initialGamesPlayed = 0,
  visible,
  onClose,
}: UserProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const [profileData, setProfileData] = useState<UserStatsResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('NONE');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible && userId) {
      setIsLoadingProfile(true);
      setProfileData(null);
      friendsApi
        .getFriendProfile(userId)
        .then((data) => {
          setProfileData(data);
          if (data.friendshipStatus) {
            setFriendshipStatus(data.friendshipStatus);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch friend profile:', err);
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [visible, userId]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!mounted || !visible || !userId) return null;

  const isSelf = currentUser?.id === userId;
  const username = profileData?.username || initialUsername;
  const avatarUrl = profileData?.avatarUrl || initialAvatarUrl;
  const rank = profileData?.globalRank || initialRank;
  const score = profileData?.totalScore ?? initialScore;
  const gamesPlayed = profileData?.totalGames ?? initialGamesPlayed;
  const winRate = profileData?.winRate != null ? Math.round(profileData.winRate) : 0;
  const topCategories = (profileData?.topCategories && profileData.topCategories.length > 0)
    ? profileData.topCategories
    : (profileData?.categories?.slice(0, 3) || []);

  const handleAddFriend = async () => {
    if (isSelf || friendshipStatus === 'ACCEPTED' || friendshipStatus === 'PENDING' || isSending) return;
    setIsSending(true);
    try {
      await friendsApi.sendFriendRequest(userId);
      setFriendshipStatus('PENDING');
    } catch {
      // silently fail
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'var(--scrim)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          maxHeight: '90vh',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--card-radius)',
          padding: 20,
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-[pop_.25s_ease-out_both] overflow-y-auto flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-surface-2)',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: 'var(--color-ink-soft)',
          }}
        >
          <X size={16} />
        </button>

        {/* Profile Card Main */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 8 }}>
          <div style={{ marginBottom: 12, position: 'relative' }}>
            <Avatar name={username} avatarUrl={avatarUrl} size={72} ring="var(--color-primary)" />
            {rank && rank <= 3 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  fontSize: 16,
                }}
              >
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </span>
            )}
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 20,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {username}
          </h3>

          <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2, marginBottom: 14 }}>
            {isSelf ? '(C\'est toi)' : rank ? `Rang #${rank} mondial` : 'Joueur Xalaat'}
          </div>

          {/* Friendship Action Button */}
          {!isSelf && (
            <div className="w-full mb-4">
              {friendshipStatus === 'ACCEPTED' ? (
                <div className="w-full py-2.5 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center gap-2">
                  <UserCheck size={16} /> Déjà ami(e)
                </div>
              ) : friendshipStatus === 'PENDING' ? (
                <div className="w-full py-2.5 rounded-full bg-warn/15 text-warn text-xs font-bold flex items-center justify-center gap-2">
                  <Clock size={16} /> Demande en attente
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddFriend}
                  disabled={isSending}
                  className="w-full py-2.5 rounded-full bg-accent text-btn-fg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  <UserPlus size={16} /> {isSending ? 'Envoi...' : 'Ajouter en ami'}
                </button>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              width: '100%',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: 'var(--color-surface-2)',
                borderRadius: 14,
                padding: '10px 6px',
                textAlign: 'center',
              }}
            >
              <Trophy size={16} style={{ color: 'var(--color-accent)', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{score}</div>
              <div style={{ fontSize: 10, color: 'var(--color-ink-soft)' }}>Points</div>
            </div>

            <div
              style={{
                background: 'var(--color-surface-2)',
                borderRadius: 14,
                padding: '10px 6px',
                textAlign: 'center',
              }}
            >
              <Swords size={16} style={{ color: 'var(--color-primary)', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{gamesPlayed}</div>
              <div style={{ fontSize: 10, color: 'var(--color-ink-soft)' }}>Parties</div>
            </div>

            <div
              style={{
                background: 'var(--color-surface-2)',
                borderRadius: 14,
                padding: '10px 6px',
                textAlign: 'center',
              }}
            >
              <Sparkles size={16} style={{ color: 'var(--color-secondary)', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {winRate}%
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-ink-soft)' }}>Victoires</div>
            </div>
          </div>

          {/* Top Categories Section */}
          <div className="w-full text-left mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-txt-40 text-[10.5px] font-bold tracking-widest uppercase">
                Tops Catégories
              </span>
              {isLoadingProfile && (
                <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {!isLoadingProfile && topCategories.length === 0 ? (
              <div className="bg-surface-2 rounded-2xl p-3 text-center text-txt-40 text-xs">
                Aucune statistique par catégorie
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topCategories.map((cat: CategoryStat, i: number) => (
                  <div
                    key={cat.category || i}
                    className="bg-surface-2/80 border border-line/60 rounded-2xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                        <Flame size={14} className="text-accent" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs text-txt truncate">{cat.category}</p>
                        <p className="text-[10.5px] text-txt-40">
                          {cat.gamesPlayed} partie{cat.gamesPlayed > 1 ? 's' : ''} · {Math.round(cat.winRate || 0)}% victoires
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-accent shrink-0 ml-2">
                      {cat.totalScore} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

