'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Swords, Sparkles, UserPlus, Check, UserCheck } from 'lucide-react';
import { Avatar } from './Avatar';
import * as friendsApi from '~/lib/api/friends';
import { useAuthStore } from '~/stores/useAuthStore';

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
  username = 'Joueur',
  avatarUrl,
  score = 1250,
  rank,
  gamesPlayed = 14,
  visible,
  onClose,
}: UserProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const [friendshipStatus, setFriendshipStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED'>('NONE');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleAddFriend = async () => {
    if (isSelf || friendshipStatus !== 'NONE' || isSending) return;
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
          maxWidth: 340,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--card-radius)',
          padding: 20,
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-[pop_.25s_ease-out_both]"
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

          <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2, marginBottom: 16 }}>
            {rank ? `Rang #${rank} mondial` : 'Joueur Xalaat'}
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              width: '100%',
              marginBottom: 18,
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
                {rank ? `#${rank}` : '-'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-ink-soft)' }}>Rang</div>
            </div>
          </div>

          {/* Friendship Action Button */}
          {!isSelf && (
            <button
              type="button"
              onClick={handleAddFriend}
              disabled={friendshipStatus !== 'NONE' || isSending}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 'var(--radius-pill)',
                background:
                  friendshipStatus === 'PENDING'
                    ? 'var(--color-surface-2)'
                    : friendshipStatus === 'ACCEPTED'
                    ? 'var(--color-surface-2)'
                    : 'var(--color-primary)',
                color:
                  friendshipStatus === 'NONE'
                    ? 'var(--color-primary-ink)'
                    : 'var(--color-ink-soft)',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: friendshipStatus === 'NONE' ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {friendshipStatus === 'PENDING' ? (
                <>
                  <Check size={16} /> Demande envoyée
                </>
              ) : friendshipStatus === 'ACCEPTED' ? (
                <>
                  <UserCheck size={16} /> Déjà ami(e)
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Ajouter en ami
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
