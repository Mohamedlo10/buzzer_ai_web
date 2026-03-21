'use client';

import { useState } from 'react';
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

// ──────────────────────────────────────────────
// Quick Action Buttons
// ──────────────────────────────────────────────

function QuickActionButton({
  icon: Icon,
  label,
  sublabel,
  onClick,
  bgColor,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  sublabel?: string;
  onClick: () => void;
  bgColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-2xl overflow-hidden hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
    >
      <div className={`p-3 ${bgColor}`}>
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <Icon size={22} color="#FFFFFF" />
        </div>
        <p className="text-white font-bold text-sm">{label}</p>
        {sublabel && (
          <p className="text-white/70 text-xs mt-0.5">{sublabel}</p>
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
      {emoji && <span className="text-lg mr-2">{emoji}</span>}
      <p className="text-white font-bold text-lg">{title}</p>
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
    <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-6 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-[#3E3666] flex items-center justify-center mb-3">
        <span className="text-3xl">{emoji}</span>
      </div>
      <p className="text-white font-semibold text-base mb-1">{title}</p>
      <p className="text-white/50 text-sm text-center mb-4 px-4">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#00D397] px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="text-[#292349] font-bold text-sm">{actionLabel}</span>
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
      setError('Le code est requis');
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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5"
      onClick={handleClose}
      style={{ display: visible && !showScanner ? undefined : 'none' }}
    >
      <div
        className="w-full max-w-sm bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
          <p className="text-white font-bold text-xl">Rejoindre</p>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-[#292349] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <X size={18} color="#FFFFFF80" />
          </button>
        </div>
          {/* QR Scanner Button */}
        <div className="px-5 pb-5">
          <button
            onClick={() => setShowScanner(true)}
            disabled={isJoining}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-[#292349] border border-[#3E3666] hover:bg-[#3E3666] transition-colors cursor-pointer"
          >
            <QrCode size={18} color="#00D397" />
            <span className="text-white/80 font-medium">Scanner un QR code</span>
          </button>
        </div>

        {/* Info text */}
        <div className="px-5 mb-4">
          <div className="bg-[#292349] rounded-xl p-3">
            <p className="text-white/50 text-xs text-center leading-4">
              Entrez le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.
            </p>
          </div>
        </div>

        {/* Code Input */}
        <div className="px-5 mb-3">
          <p className="text-white font-medium mb-2">Code secret</p>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Ex: ABC123"
            className="w-full bg-[#292349] rounded-xl px-4 py-3.5 text-white text-center text-xl font-bold tracking-widest border border-[#3E3666] focus:border-[#00D397] focus:outline-none"
            maxLength={20}
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 mb-3">
            <div className="p-3 bg-[#D5442F20] rounded-xl border border-[#D5442F40]">
              <p className="text-[#D5442F] text-center text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="px-5 pb-3 pt-1">
          <button
            onClick={handleJoin}
            disabled={isJoining || !code.trim()}
            className={`w-full py-4 rounded-2xl flex items-center justify-center transition-opacity cursor-pointer ${
              isJoining || !code.trim()
                ? 'bg-[#3E3666] cursor-not-allowed'
                : 'bg-[#D5442F] hover:bg-[#B53A28]'
            }`}
          >
            {isJoining ? (
              <Spinner text="Connexion..." />
            ) : (
              <span className="font-bold text-lg text-white">Rejoindre</span>
            )}
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

  if (isLoading) {
    return (
      <SafeScreen className="bg-[#292349] flex items-center justify-center">
        <Spinner size="large" text="Chargement du dashboard..." />
      </SafeScreen>
    );
  }

  if (isError || !data) {
    return (
      <SafeScreen className="bg-[#292349]">
        <div className="flex flex-col flex-1 items-center justify-center px-4 min-h-screen">
          <div className="w-16 h-16 rounded-full bg-[#3E3666] flex items-center justify-center mb-4">
            <span className="text-3xl">😵</span>
          </div>
          <p className="text-[#D5442F] text-lg font-semibold mb-2">Erreur de chargement</p>
          <p className="text-white/60 text-center mb-4">Impossible de charger le dashboard</p>
          <button
            onClick={() => refetch()}
            className="bg-[#00D397] px-6 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="text-[#292349] font-bold">Réessayer</span>
          </button>
        </div>
      </SafeScreen>
    );
  }

  const pendingTotal = (data.pendingInvitations || 0) + (data.pendingFriendRequests || 0);

  return (
    <SafeScreen className="bg-[#292349]">
      <DashboardHeader notificationCount={pendingTotal} />

      <div className="overflow-y-auto">
        <WelcomeSection />

        {/* ── Quick Actions ── */}
        <div className="px-4 mb-5">
          <div className="flex flex-row gap-3">
            <QuickActionButton
              icon={Plus}
              label="Créer"
              sublabel="Créer une nouvelle salle"
              onClick={() => router.push('/room/create')}
              bgColor="bg-[#00D397]"
            />
            <QuickActionButton
              icon={LogIn}
              label="Rejoindre"
              sublabel="Entrer un code"
              onClick={() => setShowJoinModal(true)}
              bgColor="bg-[#D5442F]"
            />
            <QuickActionButton
              icon={FolderOpen}
              label="Salles"
              sublabel="Voir mes salles"
              onClick={() => router.push('/rooms')}
              bgColor="bg-[#342D5B]"
            />
          </div>
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

        {/* ── Last Session ── */}
        <div className="px-4 mb-5">
          {data.lastSession ? (
            <>
              <SectionHeader title="Dernière session" emoji="🎮" />
              <LastSessionCard session={data.lastSession} />
            </>
          ) : (
            <EmptyState
              emoji="🎮"
              title="Aucune session récente"
              subtitle="Créez ou rejoignez une session pour commencer à jouer !"
              actionLabel="Créer une session"
              onAction={() => router.push('/session/create')}
            />
          )}
        </div>

        {/* ── Last Room ── */}
        {data.lastRoom && (
          <div className="px-4 mb-5">
            <SectionHeader title="Dernière salle" emoji="🏠" />
            <LastRoomCard room={data.lastRoom} />
          </div>
        )}

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
