'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors de la modification du mot de passe (vérifie ton mot de passe actuel).';
      setPasswordError(msg);
    },
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const onRefresh = useCallback(() => {
    refetchRank();
    refetchDashboard();
  }, [refetchRank, refetchDashboard]);

  async function handleLogout() {
    setShowLogoutModal(false);
    try {
      await logout();
      router.replace('/login');
    } catch { }
  }

  async function handleResendVerification() {
    setEmailBannerLoading(true);
    try {
      await usersApi.resendVerificationEmail();
      setEmailBannerSent(true);
    } catch { } finally {
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
    <SafeScreen className="bg-transparent relative flex flex-col flex-1">
      {/* Main Content Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '12px 20px 120px',
          textAlign: 'center',
        }}
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
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
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
            }}
          >
            👤 Joueur
          </div>

          {(!user.email || !user.emailVerified) ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(184, 70, 42, 0.15)',
                border: '1px solid rgba(184, 70, 42, 0.3)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-primary)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-bad animate-pulse shrink-0" />
              <span>Email non confirmé</span>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(45, 133, 89, 0.15)',
                border: '1px solid rgba(45, 133, 89, 0.3)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--good)',
              }}
            >
              <span>✓ Email confirmé</span>
            </div>
          )}
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
      {showLogoutModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-scrim/80 backdrop-blur-md z-[9999] flex items-center justify-center p-5 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-surface rounded-2xl border border-line p-6 w-full max-w-xs text-center shadow-card animate-[pop_0.25s_both]"
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
        </div>,
        document.body
      )}

      {/* Password Change Modal */}
      {showPasswordModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-scrim/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordError(null);
            setPasswordSuccess(false);
          }}
        >
          <div
            className="bg-surface rounded-3xl border border-line p-6 w-full max-w-sm flex flex-col gap-4 animate-[pop_.25s_ease-out_both]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-xl text-txt">Changer le mot de passe</p>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                  setPasswordSuccess(false);
                }}
                className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-txt-60 hover:bg-surface-2/80 transition-colors border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordSuccess ? (
              <div className="bg-good/15 border border-good/30 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
                <span className="text-2xl">✓</span>
                <p className="text-good font-bold text-sm">Mot de passe modifié avec succès !</p>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordSuccess(false);
                  }}
                  className="mt-2 bg-primary text-primary-ink font-bold text-xs px-5 py-2.5 rounded-full border-none cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                {passwordError && (
                  <div className="bg-bad/15 border border-bad/30 rounded-xl p-3 text-bad text-xs font-semibold">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="text-txt-60 text-xs font-semibold mb-1 block text-left">Mot de passe actuel</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-txt text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-txt-60 text-xs font-semibold mb-1 block text-left">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    required
                    minLength={6}
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-txt text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-txt-60 text-xs font-semibold mb-1 block text-left">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-txt text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError(null);
                    }}
                    className="flex-1 py-3 rounded-full bg-surface-2 text-txt font-bold text-xs border-none cursor-pointer hover:bg-surface-2/80 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                    className="flex-1 py-3 rounded-full bg-primary text-primary-ink font-bold text-xs border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {changePasswordMutation.isPending ? 'Enregistrement…' : 'Valider'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </SafeScreen>
  );
}
