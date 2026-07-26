'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, QrCode } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { QRScannerModal } from '~/components/ui/QRScannerModal';
import { useDashboardV2 } from '~/lib/query/hooks';
import { NotificationsBanner } from '~/components/dashboard';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';
import { useAuthStore } from '~/stores/useAuthStore';

import { PatternLozenge } from '~/components/shared/PatternLozenge';
import { PatternZigzag } from '~/components/shared/PatternZigzag';
import { Avatar } from '~/components/shared/Avatar';

// ──────────────────────────────────────────────
// Hub Progress Bar Helper
// ──────────────────────────────────────────────

function HubProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
    </div>
  );
}

// ──────────────────────────────────────────────
// Join Modal
// ──────────────────────────────────────────────

function JoinModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const resetState = () => {
    setCode('');
    setError(null);
    setIsJoining(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Le code est requis pour rejoindre.');
      return;
    }
    if (trimmedCode.replace(/[^A-Z0-9]/g, '').length < 4) {
      setError('Code trop court — vérifie les caractères saisis.');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const data = await sessionsApi.joinCheck(trimmedCode);

      if (data?.session?.id) {
        await appStorage.setActiveSession({
          sessionId: data.session.id,
          code: trimmedCode,
        });
      }

      handleClose();

      const status = data?.session?.status;
      if (status === 'LOBBY') {
        router.push(`/session/${trimmedCode}/categories`);
      } else if (status === 'GENERATING') {
        router.push(`/session/${trimmedCode}/loading`);
      } else if (['PLAYING', 'PAUSED'].includes(status)) {
        router.push(`/session/${trimmedCode}/game`);
      } else if (status === 'RESULTS') {
        router.push(`/session/${trimmedCode}/results`);
      } else {
        router.push(`/session/${trimmedCode}/lobby`);
      }
    } catch (sessionErr: any) {
      const sessionStatus = sessionErr?.response?.status;

      if (sessionStatus === 409) {
        const sessionFromError = sessionErr?.response?.data?.session;
        if (sessionFromError?.id) {
          await appStorage.setActiveSession({
            sessionId: sessionFromError.id,
            code: trimmedCode,
          });

          handleClose();

          const sStatus = sessionFromError.status;
          if (['PLAYING', 'PAUSED'].includes(sStatus)) {
            router.push(`/session/${trimmedCode}/game`);
          } else if (sStatus === 'GENERATING') {
            router.push(`/session/${trimmedCode}/loading`);
          } else if (sStatus === 'RESULTS') {
            router.push(`/session/${trimmedCode}/results`);
          } else {
            router.push(`/session/${trimmedCode}/lobby`);
          }
          return;
        }
      }

      try {
        const roomData = await roomsApi.joinRoom(trimmedCode);
        handleClose();
        router.push(`/room/${roomData.room.id}`);
      } catch (roomErr: any) {
        const status = roomErr?.response?.status;
        if (status === 404) {
          setError('Aucune salle ou partie trouvée avec ce code');
        } else if (status === 409) {
          setError('Vous avez déjà rejoint cette salle');
        } else if (status === 400) {
          setError('Cette salle est pleine');
        } else {
          setError(roomErr?.response?.data?.message || 'Erreur lors de la connexion');
        }
      } finally {
        setIsJoining(false);
      }
      return;
    }

    setIsJoining(false);
  };

  const handleQRScan = (scannedCode: string) => {
    setShowScanner(false);
    setCode(scannedCode);
    setTimeout(() => {
      setCode('');
    }, 0);
    const trimmedCode = scannedCode.trim().toUpperCase();
    if (!trimmedCode) return;

    setIsJoining(true);
    setError(null);

    sessionsApi.joinCheck(trimmedCode)
      .then(async (data) => {
        if (data?.session?.id) {
          await appStorage.setActiveSession({ sessionId: data.session.id, code: trimmedCode });
        }
        handleClose();
        const status = data?.session?.status;
        if (status === 'LOBBY') router.push(`/session/${trimmedCode}/categories`);
        else if (status === 'GENERATING') router.push(`/session/${trimmedCode}/loading`);
        else if (['PLAYING', 'PAUSED'].includes(status)) router.push(`/session/${trimmedCode}/game`);
        else if (status === 'RESULTS') router.push(`/session/${trimmedCode}/results`);
        else router.push(`/session/${trimmedCode}/lobby`);
      })
      .catch(async (sessionErr: any) => {
        if (sessionErr?.response?.status === 409) {
          const sessionFromError = sessionErr?.response?.data?.session;
          if (sessionFromError?.id) {
            await appStorage.setActiveSession({ sessionId: sessionFromError.id, code: trimmedCode });
            handleClose();
            const sStatus = sessionFromError.status;
            if (['PLAYING', 'PAUSED'].includes(sStatus)) router.push(`/session/${trimmedCode}/game`);
            else if (sStatus === 'GENERATING') router.push(`/session/${trimmedCode}/loading`);
            else if (sStatus === 'RESULTS') router.push(`/session/${trimmedCode}/results`);
            else router.push(`/session/${trimmedCode}/lobby`);
            return;
          }
        }
        roomsApi.joinRoom(trimmedCode)
          .then((roomData) => { handleClose(); router.push(`/room/${roomData.room.id}`); })
          .catch((roomErr: any) => {
            const status = roomErr?.response?.status;
            if (status === 404) setError(`Code "${trimmedCode}" non reconnu`);
            else if (status === 409) setError('Vous avez déjà rejoint cette salle');
            else setError(roomErr?.response?.data?.message || 'Erreur lors de la connexion');
          })
          .finally(() => setIsJoining(false));
        return;
      })
      .finally(() => setIsJoining(false));
  };

  if (!visible && !showScanner) return null;

  return (
    <>
      <QRScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />
      <div
        className="fixed inset-0 bg-scrim backdrop-blur-sm flex items-center justify-center z-50 p-5 animate-[fadein_.2s_ease-out_both]"
        onClick={handleClose}
        style={{ display: visible && !showScanner ? undefined : 'none' }}
      >
        <div
          className="w-full max-w-[340px] bg-surface border border-line rounded-3xl overflow-hidden animate-[pop_.3s_ease-out_both]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-row items-center justify-between px-[18px] pt-[18px] pb-2.5">
            <p className="text-txt font-display font-semibold text-xl">Rejoindre</p>
            <button
              onClick={handleClose}
              className="w-[28px] h-[28px] rounded-full bg-surface-2 flex items-center justify-center text-txt-60 hover:bg-surface transition-colors cursor-pointer border-none"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-[18px] pb-3.5">
            <div className="bg-bg rounded-xl px-3 py-2.5">
              <p className="text-txt-60 text-[12.5px] text-center leading-[1.5]">
                Entre le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.
              </p>
            </div>
          </div>

          <div className="px-[18px] pb-1.5">
            <p className="text-txt font-semibold text-[12px] mb-2">Code secret</p>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
                setError(null);
              }}
              placeholder="Ex : ABC123"
              className={`w-full bg-bg rounded-[12px] px-4 py-3 text-txt text-center font-display font-semibold text-[20px] tracking-[0.1em] border outline-none transition-colors focus:border-accent ${
                error ? 'border-buzz' : 'border-line'
              }`}
              maxLength={20}
              autoCapitalize="characters"
              autoComplete="off"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          {error && (
            <div className="px-[18px] pt-2.5">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-buzz/10 border border-buzz/30">
                <X size={14} className="text-buzz shrink-0 mt-0.5" />
                <p className="text-buzz-h text-[12.5px] font-semibold leading-[1.4]">{error}</p>
              </div>
            </div>
          )}

          <div className="px-[18px] pt-3.5 pb-2">
            <button
              onClick={handleJoin}
              disabled={isJoining || !code.trim()}
              className="w-full py-3.5 rounded-full flex items-center justify-center gap-2 font-bold text-sm transition-opacity cursor-pointer disabled:cursor-not-allowed border-none"
              style={
                isJoining || !code.trim()
                  ? { background: 'var(--color-surface-2)', color: 'var(--color-ink-soft)' }
                  : { background: 'var(--color-primary)', color: 'var(--color-primary-ink)' }
              }
            >
              {isJoining ? <Spinner text="Connexion…" /> : 'Rejoindre'}
            </button>
          </div>

          <div className="px-[18px] pb-[18px] text-center">
            <button
              onClick={() => setShowScanner(true)}
              disabled={isJoining}
              className="text-primary font-bold text-sm bg-transparent border-none cursor-pointer"
            >
              ▦ Scanner un QR code
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────
// Main Dashboard Screen — Xalaat Hub (03-hub-join-modal.jsx)
// ──────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useDashboardV2();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/admin');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <SafeScreen className="bg-bg flex items-center justify-center min-h-[100dvh]">
        <Spinner size="large" text="Chargement..." />
      </SafeScreen>
    );
  }

  if (isError || !data) {
    return (
      <SafeScreen className="bg-bg">
        <div className="flex flex-col flex-1 items-center justify-center px-4 min-h-[100dvh]">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
            <span className="text-3xl">😵</span>
          </div>
          <p className="text-buzz text-lg font-semibold mb-2">Erreur de chargement</p>
          <p className="text-txt-60 text-center mb-4">Impossible de charger le hub</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer border-none text-white font-bold"
            style={{ background: 'var(--color-primary)' }}
          >
            Réessayer
          </button>
        </div>
      </SafeScreen>
    );
  }

  const pendingTotal = (data.pendingInvitations || 0) + (data.pendingFriendRequests || 0);
  const username = user?.username || 'Momo';
  const recentRooms = data.recentRooms || [];
  const topCategory = data.topCategories?.[0]?.category || 'Histoire du Sénégal';
  const topCategoryWinRate = Math.round(data.topCategories?.[0]?.winRate || 82);
  const rank = data.globalStats?.rank || 154;

  return (
    <SafeScreen className="bg-bg min-h-[100dvh] relative overflow-hidden flex flex-col">
      {/* Background pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <PatternLozenge color="var(--color-primary)" opacity={0.05} size={26} />
      </div>

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          padding: '10px 20px 24px',
        }}
      >
        {/* Banner for pending invitations */}
        {pendingTotal > 0 && (
          <div style={{ marginBottom: 14 }}>
            <NotificationsBanner
              pendingInvitations={data.pendingInvitations}
              pendingFriendRequests={data.pendingFriendRequests}
            />
          </div>
        )}

        {/* Greeting */}
        <div style={{ margin: '8px 0 18px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 28,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
            }}
          >
            Contente de te revoir, <span style={{ color: 'var(--color-primary)' }}>{username}</span>
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-ink-soft)', lineHeight: 1.4, margin: 0 }}>
            Tes buzzers sont prêts. Prêt à tester ta stratégie ?
          </p>
        </div>

        {/* New room / Join code Quick Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          {/* Nouveau salon */}
          <div
            onClick={() => router.push('/room/create')}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-ink)',
              borderRadius: 'var(--card-radius)',
              padding: '20px 16px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
              <PatternZigzag color="var(--color-primary-ink)" opacity={0.15} size={18} />
            </div>
            <div
              style={{
                position: 'relative',
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255,255,255,0.2)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 18,
                marginBottom: 26,
              }}
            >
              +
            </div>
            <div
              style={{
                position: 'relative',
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 16,
                letterSpacing: '-0.01em',
              }}
            >
              Nouveau salon
            </div>
          </div>

          {/* Code d'accès */}
          <div
            onClick={() => setShowJoinModal(true)}
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--card-radius)',
              padding: '20px 16px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid var(--color-line)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 15,
                marginBottom: 26,
                color: 'var(--color-primary)',
              }}
            >
              →
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 16,
                letterSpacing: '-0.01em',
              }}
            >
              Code d'accès
            </div>
          </div>
        </div>

        {/* Solo mode banner */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--color-secondary)',
            color: '#FFFFFF',
            borderRadius: 'var(--card-radius)',
            padding: 18,
            marginBottom: 22,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }}>
            <PatternLozenge color="var(--color-accent)" opacity={0.2} size={22} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10.5,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              ◆ Mode solo
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 21,
                letterSpacing: '-0.015em',
                marginBottom: 8,
              }}
            >
              Entraînement & carrière
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.45, opacity: 0.82, margin: '0 0 16px', maxWidth: 260 }}>
              Défie l'IA, progresse sur 12 niveaux et gagne des xalaat-points.
            </p>
            <button
              type="button"
              onClick={() => router.push('/solo')}
              style={{
                width: '100%',
                background: 'var(--color-accent)',
                color: 'var(--color-ink)',
                borderRadius: 'var(--radius-pill)',
                padding: '12px 0',
                textAlign: 'center',
                fontSize: 13.5,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Jouer en solo →
            </button>
          </div>
        </div>

        {/* Your rooms */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 18,
              letterSpacing: '-0.015em',
            }}
          >
            Tes salons
          </div>
          <button
            type="button"
            onClick={() => router.push('/rooms')}
            style={{ fontSize: 12, color: 'var(--color-ink-soft)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Voir tout
          </button>
        </div>

        {recentRooms.length > 0 ? (
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--card-radius)',
              border: '1px solid var(--color-line)',
              padding: 16,
              marginBottom: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(232, 166, 48, 0.14)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 17,
                }}
              >
                📁
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-soft)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-surface-2)',
                  fontWeight: 700,
                }}
              >
                Salon
              </span>
            </div>
            <div
              onClick={() => router.push(`/room/${recentRooms[0].id}`)}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-display-weight)' as any,
                fontSize: 17,
                letterSpacing: '-0.01em',
                marginBottom: 4,
                cursor: 'pointer',
              }}
            >
              {recentRooms[0].name}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-ink-soft)', marginBottom: 14 }}>
              Hôte: {recentRooms[0].ownerName}
            </div>
            <div style={{ height: 1, background: 'var(--color-line)', marginBottom: 14 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex' }}>
                <Avatar name={recentRooms[0].ownerName} hue={60} size={26} ring="var(--color-surface)" />
                <span
                  style={{
                    marginLeft: -8,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--color-surface-2)',
                    border: '2px solid var(--color-surface)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: 'var(--color-ink-soft)',
                  }}
                >
                  +{recentRooms[0].memberCount - 1}
                </span>
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink-soft)' }}>
                {recentRooms[0].memberCount} membres
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--card-radius)',
              border: '1px solid var(--color-line)',
              padding: 16,
              marginBottom: 22,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', margin: '0 0 12px' }}>
              Aucun salon rejoint pour le moment.
            </p>
            <button
              onClick={() => router.push('/room/create')}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-primary-ink)',
                background: 'var(--color-primary)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Créer mon premier salon
            </button>
          </div>
        )}

        {/* Global Rank Card */}
        <div
          style={{
            background: 'var(--color-ink)',
            color: 'var(--color-bg)',
            borderRadius: 'var(--card-radius)',
            padding: '26px 20px',
            textAlign: 'center',
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }}>
            <PatternLozenge color="var(--color-accent)" opacity={0.2} size={20} />
          </div>
          <div
            style={{
              position: 'relative',
              width: 96,
              height: 96,
              margin: '0 auto 12px',
              borderRadius: '50%',
              border: '3px solid rgba(232, 166, 48, 0.35)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: '50%',
                border: '3px solid var(--color-accent)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 'var(--font-display-weight)' as any,
                  fontSize: 20,
                  letterSpacing: '-0.01em',
                  color: 'var(--color-accent)',
                }}
              >
                #{rank}
              </div>
            </div>
          </div>
          <div
            style={{
              position: 'relative',
              fontSize: 10.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              opacity: 0.6,
              marginBottom: 4,
            }}
          >
            Classement mondial
          </div>
          <div style={{ position: 'relative', fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontSize: 15 }}>
            Top 1% des joueurs
          </div>
        </div>

        {/* Stats Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          {/* Catégorie forte */}
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--card-radius)',
              border: '1px solid var(--color-line)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'rgba(232, 166, 48, 0.14)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 14,
                }}
              >
                🏆
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-soft)' }}>
                  Catégorie forte
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'var(--font-display-weight)' as any,
                    fontSize: 14.5,
                  }}
                >
                  {topCategory}
                </div>
              </div>
            </div>
            <HubProgressBar pct={topCategoryWinRate} color="var(--color-primary)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--color-ink-soft)', marginTop: 8 }}>
              <span>Précision</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{topCategoryWinRate}%</span>
            </div>
          </div>

          {/* Facteur vitesse */}
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--card-radius)',
              border: '1px solid var(--color-line)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'rgba(42, 54, 86, 0.14)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 14,
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-soft)' }}>
                  Facteur vitesse
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'var(--font-display-weight)' as any,
                    fontSize: 14.5,
                  }}
                >
                  Rapide
                </div>
              </div>
            </div>
            <HubProgressBar pct={68} color="var(--color-secondary)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--color-ink-soft)', marginTop: 8 }}>
              <span>Temps de réponse</span>
              <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>1.4s moy.</span>
            </div>
          </div>
        </div>
      </div>

      <JoinModal visible={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </SafeScreen>
  );
}
