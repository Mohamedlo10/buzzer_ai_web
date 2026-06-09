'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';
import * as authApi from '~/lib/api/auth';
import * as usersApi from '~/lib/api/users';
import { AvatarSelectionModal } from '~/components/ui/AvatarSelectionModal';

type PageState = 'waiting' | 'verifying' | 'avatar' | 'success_other_device' | 'error';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [pageState, setPageState] = useState<PageState>(token ? 'verifying' : 'waiting');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Case B: token in URL ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    authApi.verifyEmail(token)
      .then((verifiedUser) => {
        // Same browser/device and authenticated as the same user
        if (isAuthenticated && user && user.id === verifiedUser.id) {
          setUser(verifiedUser);
          setShowAvatarModal(true);
          setPageState('avatar');
        } else {
          setPageState('success_other_device');
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? 'Lien de confirmation invalide ou expiré.';
        setErrorMessage(msg);
        setPageState('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Case A: no token — poll until emailVerified ───────────────────────────
  useEffect(() => {
    if (token) return;
    if (!isAuthenticated) return;

    pollingRef.current = setInterval(async () => {
      try {
        const freshUser = await usersApi.getMe();
        if (freshUser.emailVerified) {
          clearInterval(pollingRef.current!);
          setUser(freshUser);
          setShowAvatarModal(true);
          setPageState('avatar');
        }
      } catch {
        // silent — keep polling
      }
    }, 4000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]);

  async function handleResend() {
    if (resendLoading || !isAuthenticated) return;
    setResendLoading(true);
    try {
      await usersApi.resendVerificationEmail();
      setResendSent(true);
    } catch {
      // ignore
    } finally {
      setResendLoading(false);
    }
  }

  async function handleAvatarComplete(style: string, seed: string) {
    if (!user) return;
    try {
      const updated = await usersApi.updateAvatar(user.id, style, seed);
      setUser(updated);
    } catch {
      // avatar update failure is non-blocking
    }
    router.replace('/dashboard');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 py-12">
      <AvatarSelectionModal
        open={showAvatarModal}
        defaultStyle={user?.avatarStyle ?? 'adventurer'}
        defaultSeed={user?.avatarSeed ?? 'Felix'}
        onComplete={handleAvatarComplete}
      />

      {/* Waiting state */}
      {pageState === 'waiting' && (
        <div className="w-full max-w-md bg-surface rounded-3xl p-8 border border-line text-center shadow-2xl">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(0,211,151,0.12)', border: '1px solid rgba(0,211,151,0.3)' }}
          >
            <Mail size={32} color="#00D397" />
          </div>
          <h1 className="text-txt font-bold text-2xl mb-3">Vérifiez votre boîte mail</h1>
          {user?.email && (
            <p className="text-txt-60 text-sm mb-6 leading-relaxed">
              Un lien de confirmation a été envoyé à<br />
              <span className="text-txt font-semibold">{user.email}</span>.<br />
              Cliquez sur le lien pour continuer.
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-txt-60 text-xs mb-6">En attente de confirmation…</p>

          {!resendSent ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="flex items-center gap-2 mx-auto text-accent text-sm font-semibold hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
              Renvoyer l&apos;email
            </button>
          ) : (
            <p className="text-accent text-sm font-semibold">Email renvoyé !</p>
          )}
        </div>
      )}

      {/* Verifying token */}
      {pageState === 'verifying' && (
        <div className="w-full max-w-md bg-surface rounded-3xl p-8 border border-line text-center shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-txt-60 text-sm">Vérification en cours…</p>
        </div>
      )}

      {/* Success — other device */}
      {pageState === 'success_other_device' && (
        <div className="w-full max-w-md bg-surface rounded-3xl p-8 border border-line text-center shadow-2xl">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(0,211,151,0.12)', border: '1px solid rgba(0,211,151,0.3)' }}
          >
            <CheckCircle size={32} color="#00D397" />
          </div>
          <h1 className="text-txt font-bold text-2xl mb-3">Email confirmé !</h1>
          <p className="text-txt-60 text-sm leading-relaxed">
            Votre adresse email a été confirmée avec succès.<br />
            Retournez à l&apos;application sur votre appareil principal pour continuer.
          </p>
        </div>
      )}

      {/* Error */}
      {pageState === 'error' && (
        <div className="w-full max-w-md bg-surface rounded-3xl p-8 border border-line text-center shadow-2xl">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(213,68,47,0.12)', border: '1px solid rgba(213,68,47,0.3)' }}
          >
            <XCircle size={32} color="#D5442F" />
          </div>
          <h1 className="text-txt font-bold text-2xl mb-3">Lien invalide</h1>
          <p className="text-txt-60 text-sm leading-relaxed mb-6">{errorMessage}</p>
          {isAuthenticated && (
            !resendSent ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="flex items-center gap-2 mx-auto text-accent text-sm font-semibold hover:underline disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                Renvoyer un nouvel email
              </button>
            ) : (
              <p className="text-accent text-sm font-semibold">Nouvel email envoyé !</p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}
