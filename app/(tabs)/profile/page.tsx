'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '~/stores/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '~/lib/api/users';
import * as rankingsApi from '~/lib/api/rankings';
import * as dashboardApi from '~/lib/api/dashboard';
import type { CategoryRankingResponse } from '~/types/api';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';

import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { Avatar } from '~/components/shared/Avatar';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [emailBannerLoading, setEmailBannerLoading] = useState(false);
  const [emailBannerSent, setEmailBannerSent] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: myRank, isLoading: isRankLoading, refetch: refetchRank } = useQuery({
    queryKey: ['myGlobalRank'],
    queryFn: rankingsApi.getMyGlobalRank,
    enabled: !!user,
  });

  const { data: dashboard, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getDashboard,
    enabled: !!user,
  });

  const changePasswordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const onRefresh = useCallback(() => {
    refetchRank();
    refetchDashboard();
  }, [refetchRank, refetchDashboard]);

  async function handleLogout() {
    setShowLogoutModal(false);
    try {
      await logout();
      router.replace('/login');
    } catch {}
  }

  async function handleResendVerification() {
    setEmailBannerLoading(true);
    try {
      await usersApi.resendVerificationEmail();
      setEmailBannerSent(true);
    } catch {} finally {
      setEmailBannerLoading(false);
    }
  }

  if (!user) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center min-h-[100dvh]">
        <Spinner size="large" text="Chargement du profil…" />
      </SafeScreen>
    );
  }

  const username = user.username || 'Momo';
  const totalGames = myRank?.totalGames || 0;
  const rank = myRank?.rank || 154;
  const totalWins = myRank?.totalWins || 0;
  const winRatePct = myRank?.winRate != null ? Math.round(myRank.winRate) : 0;
  const glickoRating = myRank?.glickoRating != null ? Math.round(myRank.glickoRating) : 1500;

  return (
    <SafeScreen className="bg-bg min-h-[100dvh] relative overflow-hidden flex flex-col">
      {/* Background pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <PatternLozenge color="var(--color-primary)" opacity={0.05} size={26} />
      </div>

      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px 32px',
          textAlign: 'center',
        }}
        className="overflow-y-auto"
      >
        {/* Avatar with edit icon */}
        <div style={{ position: 'relative', width: 88, height: 88, margin: '12px auto 12px' }}>
          <Avatar name={username} avatarUrl={user.avatarUrl} hue={30} size={88} />
          <button
            type="button"
            onClick={() => router.push('/profile/edit')}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              color: 'var(--color-ink)',
              cursor: 'pointer',
            }}
          >
            ✎
          </button>
        </div>

        {/* Username & role */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--font-display-weight)' as any,
            fontSize: 22,
            letterSpacing: '-0.015em',
            marginBottom: 6,
          }}
        >
          {username}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-surface-2)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-ink-soft)',
            marginBottom: 18,
          }}
        >
          👤 Joueur
        </div>

        {/* Email verification alert banner */}
        {(!user.email || !user.emailVerified) && (
          <div
            style={{
              background: 'rgba(184, 70, 42, 0.1)',
              border: '1px solid rgba(184, 70, 42, 0.3)',
              borderRadius: 'var(--card-radius)',
              padding: '14px 16px',
              textAlign: 'left',
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
              ⚠ Confirme ton email
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginBottom: 6 }}>
              Un email de confirmation a été envoyé à {user.email || 'ton adresse'}.
            </div>
            <button
              onClick={handleResendVerification}
              disabled={emailBannerLoading}
              type="button"
              style={{
                fontSize: 12.5,
                color: 'var(--color-primary)',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {emailBannerSent ? 'Email renvoyé ✓' : "↻ Renvoyer l'email"}
            </button>
          </div>
        )}

        {/* Stats Grid Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: 16,
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--color-accent)' }}>
              #{rank}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 2 }}>Rang global</div>
          </div>

          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: 16,
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>📊</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--color-secondary)' }}>
              {glickoRating}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 2 }}>Rating Glicko-2</div>
          </div>
        </div>

        {/* Stats Grid Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: 16,
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>🎮</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>
              {totalGames}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 2 }}>Parties</div>
          </div>

          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: 16,
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>🏅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>
              {totalWins}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 2 }}>
              Victoires · {winRatePct}%
            </div>
          </div>
        </div>

        {/* Info card */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-line)',
            borderRadius: 'var(--card-radius)',
            marginBottom: 22,
            textAlign: 'left',
          }}
        >
          {[
            { ic: '✉️', l: 'Email', v: user.email || 'Non défini' },
            {
              ic: '📅',
              l: 'Membre depuis',
              v: new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            },
          ].map((row, i, arr) => (
            <div
              key={row.l}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none',
              }}
            >
              <span style={{ fontSize: 16 }}>{row.ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>{row.l}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{row.v}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push('/profile/edit')}
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-ink)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: 20,
            }}
          >
            <span>✎ Modifier le profil</span>
            <span>›</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-2)',
              color: 'var(--color-ink)',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: 20,
            }}
          >
            <span>🔒 Changer le mot de passe</span>
            <span>›</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              color: 'var(--color-ink)',
              border: '1.5px solid var(--color-line)',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Actualiser
          </button>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              color: 'var(--color-primary)',
              border: '1.5px solid rgba(184,70,42,0.4)',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ↪ Se déconnecter
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: 20 }}>
          Xalaat · v1.0.0
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-scrim/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-surface rounded-2xl border border-line p-6 w-full max-w-xs text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Se déconnecter ?
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 20 }}>
              Es-tu sûr de vouloir te déconnecter de ton compte ?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                type="button"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-ink)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                type="button"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-primary-ink)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </SafeScreen>
  );
}
