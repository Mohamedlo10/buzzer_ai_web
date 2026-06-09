'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FolderOpen,
  LogIn,
  X,
  Gamepad2,
  QrCode,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { DashboardHeader, WelcomeSection } from '~/components/layout/DashboardHeader';
import { Spinner } from '~/components/loading/Spinner';
import { QRScannerModal } from '~/components/ui/QRScannerModal';
import { useDashboardV2 } from '~/lib/query/hooks';
import {
  LastSessionCard,
  LastRoomCard,
  GlobalStatsCard,
  CategoryPodiumCard,
  NotificationsBanner,
} from '~/components/dashboard';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';
import { useAuthStore } from '~/stores/useAuthStore';

// ──────────────────────────────────────────────
// Quick Action Buttons
// ──────────────────────────────────────────────

function QuickActionButton({
  icon: Icon,
  label,
  sublabel,
  onClick,
  background,
  textColor = '#FFFFFF',
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  sublabel?: string;
  onClick: () => void;
  background: string;
  textColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-2xl overflow-hidden hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
    >
      <div className="px-3 pt-3 pb-3.5 h-full" style={{ background }}>
        <div
          className="w-[38px] h-[38px] rounded-[11px] bg-white/20 flex items-center justify-center mb-3"
          style={{ color: textColor }}
        >
          <Icon size={20} color={textColor} />
        </div>
        <p className="font-bold text-sm" style={{ color: textColor }}>{label}</p>
        {sublabel && (
          <p className="text-xs mt-0.5" style={{ color: textColor, opacity: 0.72 }}>{sublabel}</p>
        )}
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────
// Section Header
// ──────────────────────────────────────────────

function SectionHeader({ title, emoji }: { title: string; emoji?: string }) {
  return (
    <div className="flex flex-row items-center mb-3">
      {emoji && <span className="text-[17px] mr-2">{emoji}</span>}
      <p className="text-txt font-display font-semibold text-[17px] tracking-[-0.01em]">{title}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────

function EmptyState({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-3">
        <span className="text-3xl">{emoji}</span>
      </div>
      <p className="text-txt font-semibold text-base mb-1">{title}</p>
      <p className="text-txt-60 text-sm text-center mb-4 px-4">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
        >
          <span className="text-btn-fg font-bold text-sm">{actionLabel}</span>
        </button>
      )}
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
    // Auto-submit after scan
    setTimeout(() => {
      setCode('');
    }, 0);
    // Trigger join directly with scanned code
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
        // Fallback: try as room code
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
        {/* Header */}
        <div className="flex flex-row items-center justify-between px-[18px] pt-[18px] pb-2.5">
          <p className="text-txt font-display font-semibold text-xl">Rejoindre</p>
          <button
            onClick={handleClose}
            className="w-[34px] h-[34px] rounded-full bg-bg flex items-center justify-center text-txt-60 hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Info text — guidage */}
        <div className="px-[18px] pb-3.5">
          <div className="bg-bg rounded-xl px-3 py-2.5">
            <p className="text-txt-60 text-[11.5px] text-center leading-[1.5]">
              Entre le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.
            </p>
          </div>
        </div>

        {/* Code Input */}
        <div className="px-[18px] pb-1.5">
          <p className="text-txt font-semibold text-[13px] mb-2">Code secret</p>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
              setError(null);
            }}
            placeholder="Ex: ABC123"
            className={`w-full bg-bg rounded-[14px] px-4 py-3.5 text-txt text-center font-display font-semibold text-[22px] tracking-[0.16em] border-[1.5px] outline-none transition-colors focus:border-accent ${
              error ? 'border-buzz' : 'border-line'
            }`}
            maxLength={20}
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {/* Error — qualité du message + piste de correction (B&S) */}
        {error && (
          <div className="px-[18px] pt-2.5">
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-buzz/10 border border-buzz/30">
              <X size={14} className="text-buzz shrink-0 mt-0.5" />
              <p className="text-buzz-h text-[12.5px] font-semibold leading-[1.4]">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="px-[18px] pt-3.5 pb-2">
          <button
            onClick={handleJoin}
            disabled={isJoining || !code.trim()}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-opacity cursor-pointer disabled:cursor-not-allowed"
            style={
              isJoining || !code.trim()
                ? { background: 'var(--surface-2)', color: 'var(--txt-40)' }
                : { background: 'linear-gradient(135deg, #FF5C44, #D5442F)', color: '#FFFFFF' }
            }
          >
            {isJoining ? (
              <Spinner text="Connexion…" />
            ) : (
              'Rejoindre'
            )}
          </button>
        </div>

        {/* QR Scanner Button */}
        <div className="px-[18px] pb-[18px]">
          <button
            onClick={() => setShowScanner(true)}
            disabled={isJoining}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-surface border border-line hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <QrCode size={18} className="text-accent" />
            <span className="text-accent font-medium text-sm">Scanner un QR code</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

// ──────────────────────────────────────────────
// Main Dashboard Screen
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
      <SafeScreen className="bg-bg flex items-center justify-center">
        <Spinner size="large" text="Chargement du dashboard..." />
      </SafeScreen>
    );
  }

  if (isError || !data) {
    return (
      <SafeScreen className="bg-bg">
        <div className="flex flex-col flex-1 items-center justify-center px-4 min-h-screen">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
            <span className="text-3xl">😵</span>
          </div>
          <p className="text-buzz text-lg font-semibold mb-2">Erreur de chargement</p>
          <p className="text-txt-60 text-center mb-4">Impossible de charger le dashboard</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
          >
            <span className="text-btn-fg font-bold">Réessayer</span>
          </button>
        </div>
      </SafeScreen>
    );
  }

  const pendingTotal = (data.pendingInvitations || 0) + (data.pendingFriendRequests || 0);

  return (
    <SafeScreen className="bg-bg">
      <DashboardHeader notificationCount={pendingTotal} />

      <div className="overflow-y-auto">
        <WelcomeSection />

        {/* ── Quick Actions — contrôle explicite, signifiance (B&S) ── */}
        <div className="px-4 mb-5">
          <div className="flex flex-row gap-3">
            <QuickActionButton
              icon={Plus}
              label="Créer"
              sublabel="Une salle"
              onClick={() => router.push('/room/create')}
              background="linear-gradient(140deg, #00D397, #00B383)"
            />
            <QuickActionButton
              icon={LogIn}
              label="Rejoindre"
              sublabel="Un code"
              onClick={() => setShowJoinModal(true)}
              background="linear-gradient(140deg, #FF5C44, #D5442F)"
            />
            <QuickActionButton
              icon={FolderOpen}
              label="Salles"
              sublabel="Mes salles"
              onClick={() => router.push('/rooms')}
              background="var(--surface)"
              textColor="var(--txt)"
            />
          </div>
        </div>

        {/* ── Solo Mode Banner ── */}
        <div className="px-4 mb-6 animate-[rise_0.4s_both]">
          <button
            onClick={() => router.push('/solo')}
            className="w-full relative overflow-hidden bg-gradient-to-r from-surface to-surface-2 border-[1.5px] border-accent/40 rounded-[20px] p-[18px] flex flex-row items-center justify-between hover:border-accent active:scale-[0.99] transition-all duration-150 cursor-pointer text-left"
            style={{
              boxShadow: '0 0 25px rgba(0, 211, 151, 0.12)',
            }}
          >
            {/* Ambient glow accent backgrounds */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-host/15 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-row items-center gap-4 relative z-10 min-w-0 flex-1 pr-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-d flex items-center justify-center text-btn-fg shrink-0 shadow-lg">
                <Gamepad2 size={24} className="animate-[float_3s_ease-in-out_infinite]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-txt font-display font-bold text-[15px] tracking-tight">
                    Entraînement & Carrière Solo
                  </h3>
                  <span className="bg-energy text-btn-fg text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                    Nouveau 🧠
                  </span>
                </div>
                <p className="text-txt-60 text-xs mt-1 leading-normal max-w-[240px]">
                  Défiez l'IA, progressez sur 12 niveaux de carrière et gagnez des points !
                </p>
              </div>
            </div>
            
            <div className="px-4 py-2.5 rounded-xl bg-accent text-btn-fg font-bold text-xs shrink-0 shadow-soft hover:opacity-90 transition-opacity relative z-10">
              Jouer
            </div>
          </button>
        </div>

        {/* ── Notifications ── */}
        {pendingTotal > 0 && (
          <div className="px-4 mb-5">
            <NotificationsBanner
              pendingInvitations={data.pendingInvitations}
              pendingFriendRequests={data.pendingFriendRequests}
            />
          </div>
        )}
        {/* ── Recent Rooms ── */}
        {data.recentRooms && data.recentRooms.length > 0 && (
          <div className="mb-5">
            <div className="px-4">
              <SectionHeader title="Salles récentes" emoji="🏠" />
            </div>
            <div className="flex flex-row gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
              {data.recentRooms.map((room) => (
                <div key={room.id} className="min-w-[75vw]">
                  <LastRoomCard room={room} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Sessions ── */}
        <div className="mb-5">
          {data.recentSessions && data.recentSessions.length > 0 ? (
            <>
              <div className="px-4">
                <SectionHeader title="Sessions récentes" emoji="🎮" />
              </div>
              <div className="flex flex-row gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
                {data.recentSessions.map((session) => (
                  <div key={session.id} className="min-w-[85vw]">
                    <LastSessionCard session={session} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="px-4">
              <EmptyState
                emoji="🎮"
                title="Aucune session récente"
                subtitle="Créez ou rejoignez une session pour commencer à jouer !"
                actionLabel="Créer une session"
                onAction={() => router.push('/session/create')}
              />
            </div>
          )}
        </div>

       
        {/* ── Category Podium ── */}
        <div className="px-4 mb-5">
          <CategoryPodiumCard categories={data.topCategories} />
        </div>

        {/* ── Global Stats ── */}
        <div className="px-4 mb-5">
          <SectionHeader title="Mes statistiques" emoji="📊" />
          {data.globalStats.totalGames > 0 ? (
            <GlobalStatsCard stats={data.globalStats} />
          ) : (
            <EmptyState
              emoji="📊"
              title="Pas encore de stats"
              subtitle="Jouez votre première partie pour voir vos statistiques apparaître ici"
            />
          )}
        </div>

        {/* Bottom spacing for tab bar */}
        <div className="h-8" />
      </div>

      <JoinModal visible={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </SafeScreen>
  );
}
