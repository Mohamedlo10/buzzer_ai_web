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
  Bell,
  ChevronRight,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { QRScannerModal } from '~/components/ui/QRScannerModal';
import { useDashboardV2 } from '~/lib/query/hooks';
import { NotificationsBanner } from '~/components/dashboard';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { appStorage } from '~/lib/utils/storage';
import { useAuthStore } from '~/stores/useAuthStore';

// ──────────────────────────────────────────────
// Room Card component for the horizontal scroll
// ──────────────────────────────────────────────

function RoomCard({ room }: { room: any }) {
  const router = useRouter();
  
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) return "Récemment";
      if (hours < 24) return `Actif il y a ${hours}h`;
      const days = Math.floor(hours / 24);
      return `Actif il y a ${days}j`;
    } catch {
      return "Actif";
    }
  };

  return (
    <button
      onClick={() => router.push(`/room/${room.id}`)}
      className="bg-surface border border-line rounded-3xl p-5 min-w-[250px] text-left relative overflow-hidden hover:opacity-95 active:scale-98 transition-all cursor-pointer shadow-soft flex flex-col justify-between h-[180px]"
    >
      <div className="w-full flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <FolderOpen size={18} />
        </div>
        <span className="text-[10px] font-bold bg-surface-2 border border-line px-2.5 py-0.5 rounded-full text-txt-60 uppercase tracking-wide">
          Salon
        </span>
      </div>
      
      <div>
        <h4 className="text-txt font-bold text-base truncate leading-snug">{room.name}</h4>
        <p className="text-txt-40 text-xs mt-1">{formatTimeAgo(room.joinedAt)}</p>
      </div>

      <div className="flex items-center justify-between mt-4 border-t border-line/40 pt-3">
        {/* Avatars group mockup */}
        <div className="flex -space-x-2 overflow-hidden">
          <div className="inline-block h-6 w-6 rounded-full bg-accent/20 border-2 border-surface flex items-center justify-center text-[8px] font-bold text-accent uppercase">
            {room.ownerName.charAt(0)}
          </div>
          <div className="inline-block h-6 w-6 rounded-full bg-surface-2 border-2 border-surface flex items-center justify-center text-[8px] font-bold text-txt-60">
            A
          </div>
          {room.memberCount > 2 && (
            <div className="inline-block h-6 w-6 rounded-full bg-surface-2 border-2 border-surface flex items-center justify-center text-[7px] font-bold text-txt-40">
              +{room.memberCount - 2}
            </div>
          )}
        </div>
        <span className="text-txt-60 text-xs font-semibold">{room.memberCount} Membres</span>
      </div>
    </button>
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
            className="w-[34px] h-[34px] rounded-full bg-bg flex items-center justify-center text-txt-60 hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-[18px] pb-3.5">
          <div className="bg-bg rounded-xl px-3 py-2.5">
            <p className="text-txt-60 text-[11.5px] text-center leading-[1.5]">
              Entre le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.
            </p>
          </div>
        </div>

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
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-opacity cursor-pointer disabled:cursor-not-allowed"
            style={
              isJoining || !code.trim()
                ? { background: 'var(--surface-2)', color: 'var(--txt-40)' }
                : { background: 'linear-gradient(135deg, var(--bad-h), var(--bad))', color: '#FFFFFF' }
            }
          >
            {isJoining ? (
              <Spinner text="Connexion…" />
            ) : (
              'Rejoindre'
            )}
          </button>
        </div>

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
        <Spinner size="large" text="Chargement..." />
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
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-d))' }}
          >
            <span className="text-btn-fg font-bold">Réessayer</span>
          </button>
        </div>
      </SafeScreen>
    );
  }

  const pendingTotal = (data.pendingInvitations || 0) + (data.pendingFriendRequests || 0);
  const activeRooms = data.recentRooms?.filter((room) => room.hasActiveSession) || [];

  return (
    <SafeScreen className="bg-bg">
      {/* ── Custom Header (aligned with mockup) ── */}
      <div className="flex flex-row items-center justify-between px-5 pt-6 pb-4">
        <div className="flex flex-row items-center gap-3">
          {/* Profile Avatar */}
          <button
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-full overflow-hidden border border-line bg-surface-2 flex items-center justify-center"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-txt font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          <span className="text-txt font-display font-bold text-sm tracking-widest uppercase">
            XALAAT HUB
          </span>
        </div>

        {/* Actions (Bell notification) */}
        <div className="flex flex-row items-center gap-2">
          {/* Bascule de thème retirée — l'app est en clair pour tous.
              À réafficher en même temps que le mode sombre (cf. ThemeProvider).
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-txt hover:text-accent transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          */}

          {/* Notification Bell */}
          <button
            onClick={() => router.push('/notifications')}
            className="relative w-10 h-10 flex items-center justify-center text-txt hover:text-accent transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {pendingTotal > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-buzz rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>

      <div className="overflow-y-auto pb-24">
        {/* ── Welcome back section ── */}
        <div className="px-5 py-4">
          <h1 className="text-txt font-display font-bold text-2xl tracking-tight leading-tight">
            Welcome back, {user?.username || 'Joueur'}
          </h1>
          <p className="text-txt-60 text-xs mt-1 leading-normal max-w-[280px]">
            Les buzzers sont prêts. Prêt à tester votre stratégie ?
          </p>
        </div>

        {/* ── Quick Action Cards ── */}
        <div className="px-5 mb-6">
          <div className="grid grid-cols-2 gap-4">
            {/* New Room */}
            <button
              onClick={() => router.push('/room/create')}
              className="rounded-[24px] bg-gradient-to-br from-accent-d to-accent-d p-5 flex flex-col items-center justify-center gap-3 text-center shadow-lg hover:opacity-95 active:scale-98 transition-all cursor-pointer min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full border-[1.5px] border-white/40 flex items-center justify-center text-white">
                <Plus size={20} />
              </div>
              <span className="text-white font-display font-bold text-base">New Room</span>
            </button>

            {/* Join Code */}
            <button
              onClick={() => setShowJoinModal(true)}
              className="rounded-[24px] bg-surface border border-line p-5 flex flex-col items-center justify-center gap-3 text-center shadow-lg hover:bg-surface-2 active:scale-98 transition-all cursor-pointer min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full border-[1.5px] border-accent/45 flex items-center justify-center text-accent">
                <LogIn size={18} />
              </div>
              <span className="text-txt font-display font-bold text-base">Join Code</span>
            </button>
          </div>
        </div>

        {/* ── Active Session Section ── */}
        {activeRooms.length > 0 && (
          <div className="px-5 mb-6">
            <div className="relative overflow-hidden bg-surface border border-line border-l-[4px] border-l-accent rounded-3xl p-5 shadow-soft animate-[rise_0.4s_both]">
              <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col gap-1.5 relative z-10">
                <span className="text-accent text-[10px] font-bold uppercase tracking-wider">
                  • ACTIVE SESSION
                </span>
                <h3 className="text-txt font-display font-bold text-xl leading-tight">
                  {activeRooms[0].name}
                </h3>
                <p className="text-txt-60 text-xs mt-0.5 leading-normal">
                  Hosted by <span className="text-accent font-semibold">{activeRooms[0].ownerName}</span> • {activeRooms[0].memberCount} Membres active
                </p>
                <button
                  onClick={() => router.push(`/room/${activeRooms[0].id}`)}
                  className="mt-4 w-full py-3.5 rounded-2xl bg-accent text-btn-fg font-bold text-sm tracking-wide uppercase hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Jump In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Solo Mode Section ── */}
        <div className="px-5 mb-6">
          <div className="relative overflow-hidden bg-surface border border-line border-l-[4px] border-l-host rounded-3xl p-5 shadow-soft animate-[rise_0.4s_both]">
            <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-host/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col gap-1.5 relative z-10">
              <span className="text-host text-[10px] font-bold uppercase tracking-wider">
                • SOLO MODE
              </span>
              <h3 className="text-txt font-display font-bold text-xl leading-tight">
                Entraînement & Carrière
              </h3>
              <p className="text-txt-60 text-xs mt-0.5 leading-normal">
                Défiez l'IA, progressez sur 12 niveaux de carrière et gagnez des points !
              </p>
              <button
                onClick={() => router.push('/solo')}
                className="mt-4 w-full py-3.5 rounded-2xl bg-host text-white font-bold text-sm tracking-wide uppercase hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              >
                Jouer en Solo
              </button>
            </div>
          </div>
        </div>

        {/* ── Notifications Banner ── */}
        {pendingTotal > 0 && (
          <div className="px-5 mb-6">
            <NotificationsBanner
              pendingInvitations={data.pendingInvitations}
              pendingFriendRequests={data.pendingFriendRequests}
            />
          </div>
        )}

        {/* ── Your Rooms (horizontal carousel) ── */}
        {data.recentRooms && data.recentRooms.length > 0 && (
          <div className="mb-6">
            <div className="px-5 flex items-center justify-between mb-4">
              <h3 className="text-txt font-display font-bold text-lg tracking-tight">Your Rooms</h3>
              <button
                onClick={() => router.push('/rooms')}
                className="text-accent font-semibold text-xs tracking-wide hover:opacity-80 transition-opacity"
              >
                View All
              </button>
            </div>
            
            <div className="flex flex-row gap-4 overflow-x-auto px-5 pb-3 scrollbar-none">
              {data.recentRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {/* ── Personal Best (Classment & Stats) ── */}
        <div className="px-5 mb-6">
          <h3 className="text-txt font-display font-bold text-lg tracking-tight mb-4">Personal Best</h3>
          
          {/* Rank Card */}
          <div className="bg-surface border border-line rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-soft mb-4">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Rank badge */}
            <div className="w-24 h-24 rounded-full border-[3px] border-accent/20 flex items-center justify-center relative mb-4">
              <div className="absolute inset-2 rounded-full border border-accent/30 flex items-center justify-center bg-accent/5">
                <span className="text-accent font-display font-bold text-2xl">
                  #{data.globalStats.rank || '--'}
                </span>
              </div>
            </div>
            
            <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-1">
              GLOBAL RANK
            </p>
            <p className="text-txt-60 text-xs">
              {data.globalStats.totalGames > 0 
                ? `Top ${Math.max(1, Math.round(100 - data.globalStats.winRate))}% des joueurs`
                : "Aucune partie jouée"}
            </p>
          </div>

          {/* Top category & Speed details card */}
          <div className="bg-surface border border-line rounded-3xl p-5 flex flex-col gap-5 shadow-soft">
            {/* Top Category */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <span className="text-sm">🏆</span>
                </div>
                <div>
                  <p className="text-txt-40 text-[9px] font-bold tracking-widest uppercase leading-none">TOP CATEGORY</p>
                  <p className="text-txt font-bold text-sm mt-1 truncate max-w-[200px]">
                    {data.topCategories?.[0]?.category || 'Culture Générale'}
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden mt-1 relative">
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-500" 
                  style={{ width: `${data.topCategories?.[0]?.winRate || 80}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-txt-40">
                <span>Précision</span>
                <span className="text-accent font-bold">
                  {Math.round(data.topCategories?.[0]?.winRate || 80)}%
                </span>
              </div>
            </div>
            
            {/* Speed Factor */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-host/10 flex items-center justify-center text-host shrink-0">
                  <span className="text-sm">⚡</span>
                </div>
                <div>
                  <p className="text-txt-40 text-[9px] font-bold tracking-widest uppercase leading-none">SPEED FACTOR</p>
                  <p className="text-txt font-bold text-sm mt-1">
                    {data.globalStats.avgScore > 20 ? 'Hyper-Agile' : 'Rapide'}
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden mt-1 relative">
                <div 
                  className="bg-gradient-to-r from-host to-accent h-full rounded-full transition-all duration-500" 
                  style={{ width: '75%' }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-txt-40">
                <span>Temps de réponse</span>
                <span className="text-host font-bold">1.4s avg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <JoinModal visible={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </SafeScreen>
  );
}
