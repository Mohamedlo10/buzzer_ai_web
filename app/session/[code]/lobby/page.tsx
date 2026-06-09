'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Crown,
  Play,
  LogOut,
  Eye,
  X,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trophy,
  Hash,
  Trash2,
  QrCode,
  PenLine,
  TrendingUp,
  Minus,
  Plus,
  DoorOpen,
  Share2,
  Gamepad2,
  Zap,
} from 'lucide-react';
import { Orbitron, Rajdhani } from 'next/font/google';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { QRCodeModal } from '~/components/ui/QRCodeModal';
import { Avatar } from '~/components/ui/Avatar';
import { ConfirmModal } from '~/components/ui/ConfirmModal';
import { PlayerProfileModal } from '~/components/ui/PlayerProfileModal';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import { appStorage } from '~/lib/utils/storage';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { getUserProfile } from '~/lib/api/users';
import { Slider } from '~/components/ui/Slider';
import type { RoomInfo, PlayerResponse, TeamResponse } from '~/types/api';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['400', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ─── ManualQuestionsAlert ─────────────────────────────────────────────────────
function ManualQuestionsAlert({
  totalQuestions,
  sessionId,
  code,
  onNavigate,
}: {
  totalQuestions: number;
  sessionId: string;
  code: string;
  onNavigate: () => void;
}) {
  const has = totalQuestions > 0;
  return (
    <div className="rounded-[14px] bg-surface border border-energy/15 mb-3 overflow-hidden">
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-energy/10 flex items-center justify-center">
            <PenLine size={16} className="text-energy" />
          </div>
          <div>
            <p className="text-txt font-bold text-[13px]">Questions manuelles</p>
            <p className="text-txt-60 text-[11px]">
              {has ? `${totalQuestions} question(s) prête(s)` : 'Aucune question saisie'}
            </p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="px-3 py-1.5 rounded-[9px] bg-energy/10 border border-energy/20 text-energy text-xs font-semibold cursor-pointer hover:bg-energy/15 transition-colors"
        >
          {has ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
      {!has && (
        <div className="px-3.5 pb-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-buzz/5 border border-buzz/15">
            <AlertCircle size={12} className="text-buzz shrink-0" />
            <span className="text-buzz text-[11px]">Ajoutez des questions avant de démarrer</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ArcadeTeamsSection ───────────────────────────────────────────────────────
function ArcadeTeamsSection({
  teams,
  currentPlayerId,
  isManager,
  userId,
  avatarMap,
  onChangeTeam,
  onManagerReassign,
  orbitronClass,
  rajdhaniClass,
}: {
  teams: TeamResponse[];
  currentPlayerId: string | null;
  isManager: boolean;
  userId?: string;
  avatarMap: Record<string, string | null>;
  onChangeTeam: () => void;
  onManagerReassign: (id: string, name: string) => void;
  orbitronClass: string;
  rajdhaniClass: string;
}) {
  return (
    <div className="px-4 pt-5">
      <div className="rounded-[18px] overflow-hidden bg-surface border border-line">
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-[#4A90D9]" />
            <span className={`${orbitronClass} text-txt-40 text-[10px] tracking-[0.2em] font-bold`}>ÉQUIPES</span>
          </div>
          {!isManager && (
            <button
              onClick={onChangeTeam}
              className="px-2.5 py-1 rounded-lg bg-[#4A90D9]/10 border border-[#4A90D9]/15 text-[#4A90D9] text-[11px] font-semibold cursor-pointer hover:bg-[#4A90D9]/15 transition-colors"
            >
              Changer
            </button>
          )}
        </div>
        {teams.map((team, idx) => (
          <div key={team.id} className={idx < teams.length - 1 ? 'border-b border-line' : ''}>
            <div className="px-5 py-2.5 flex items-center gap-2.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: team.color ?? '#3A3A5E',
                  boxShadow: `0 0 5px ${team.color ?? '#3A3A5E'}`,
                }}
              />
              <span className={`${rajdhaniClass} flex-1 text-txt font-semibold text-sm`}>{team.name}</span>
              <span className={`${rajdhaniClass} text-txt-40 text-xs`}>
                {team.members.length} joueur{team.members.length !== 1 ? 's' : ''}
              </span>
            </div>
            {team.members.map((member) => {
              const isMe = member.id === currentPlayerId;
              return (
                <div
                  key={member.id}
                  className={`px-5 py-1.5 flex items-center gap-2.5 ${isMe ? 'bg-accent/5' : ''}`}
                >
                  <Avatar
                    avatarUrl={member.userId ? (avatarMap[member.userId] ?? member.avatarUrl) : member.avatarUrl}
                    username={member.name}
                    size={26}
                    borderColor={isMe ? '#00D397' : undefined}
                  />
                  <span
                    className={`${rajdhaniClass} flex-1 text-[13px] ${isMe ? 'text-accent font-semibold' : 'text-txt-60'}`}
                  >
                    {member.name}{isMe ? ' (vous)' : ''}
                  </span>
                  {isManager && (
                    <button
                      onClick={() => onManagerReassign(member.id, member.name)}
                      className="w-[26px] h-[26px] rounded-md bg-surface-2 border border-line flex items-center justify-center cursor-pointer hover:bg-surface-2/80 transition-colors text-txt-40"
                    >
                      <ChevronRight size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LobbyPage ────────────────────────────────────────────────────────────────
export default function LobbyPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [kickingPlayerId, setKickingPlayerId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [teamPickerTargetPlayer, setTeamPickerTargetPlayer] = useState<{ id: string; name: string } | null>(null);
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [showQLimit, setShowQLimit] = useState(false);
  const [adjustedQPerCat, setAdjustedQPerCat] = useState(1);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [selectedLobbyPlayer, setSelectedLobbyPlayer] = useState<PlayerResponse | null>(null);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqText, setReqText] = useState('');
  const [reqSent, setReqSent] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { session, players, teams, fetchSession, startSession, deleteSession, isStarting, leaveSession } = useBuzzStore();

  const isManager = session?.managerId === user?.id;
  const currentPlayer = players.find((p) => p.userId === user?.id);
  const { isConnected } = useGameSocket(session?.id || null);

  useEffect(() => {
    if (!code) return;
    if (session && session.code === code) return;
    if (session && session.code !== code) leaveSession();
    const loadSession = async () => {
      try {
        const activeSession = await appStorage.getActiveSession();
        if (activeSession?.sessionId) { await fetchSession(activeSession.sessionId); return; }
        const checkResult = await useBuzzStore.getState().joinCheck(code);
        if (checkResult?.sessionId) {
          await fetchSession(checkResult.sessionId);
          await appStorage.setActiveSession({ sessionId: checkResult.sessionId, code: checkResult.code });
        } else { router.replace('/'); }
      } catch { router.replace('/'); }
    };
    loadSession();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session?.id) return;
    const ms = isConnected ? 8000 : 2000;
    const interval = setInterval(() => fetchSession(session.id), ms);
    return () => clearInterval(interval);
  }, [session?.id, fetchSession, isConnected]);

  useEffect(() => {
    if (session?.id) fetchSession(session.id);
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session?.roomId) return;
    const loadRoomInfo = async () => {
      try { const data = await roomsApi.getRoomDetail(session.roomId!); setRoomInfo(data.room); }
      catch { /* ignore */ }
    };
    loadRoomInfo();
  }, [session?.roomId]);

  useEffect(() => {
    if (session?.status === 'GENERATING') router.replace(`/session/${code}/loading`);
    else if (session?.status === 'PLAYING') router.replace(`/session/${code}/game`);
    else if (session?.status === 'RESULTS') router.replace(`/session/${code}/results`);
  }, [session?.status, code]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!players.length) return;
    players.forEach((player) => {
      if (!player.userId) return;
      if (player.userId === user?.id) {
        setAvatarMap((prev) => ({ ...prev, [player.userId]: user.avatarUrl ?? null }));
        return;
      }
      if (player.userId in avatarMap) return;
      setAvatarMap((prev) => ({ ...prev, [player.userId]: null }));
      getUserProfile(player.userId).then((profile) => {
        setAvatarMap((prev) => ({ ...prev, [player.userId]: profile.avatarUrl ?? null }));
      }).catch(() => {});
    });
  }, [players]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyCode = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch { /* fallback */ }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    const msg = `Rejoins ma partie Quiz By Mouha_Dev! Code: ${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Invitation Quiz By Mouha_Dev', text: msg }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(msg);
      window.alert('Lien copié dans le presse-papiers !');
    }
  };

  const Q_LIMIT = 60;

  const handleStartGame = async () => {
    if (!session?.id || !code) return;
    if (session.questionMode === 'AI') {
      const realPlayers = session.sessionMode !== 'WITH_MODERATOR'
        ? players.filter((p) => !p.isSpectator).length
        : players.filter((p) => !p.isSpectator && !p.isManager).length;
      const total = (session.maxCategoriesPerPlayer ?? 1) * (session.questionsPerCategory ?? 1) * realPlayers;
      if (total > Q_LIMIT) {
        const maxAllowed = Math.max(1, Math.floor(Q_LIMIT / ((session.maxCategoriesPerPlayer ?? 1) * realPlayers)));
        setAdjustedQPerCat(maxAllowed);
        setShowQLimit(true);
        return;
      }
    }
    try { await startSession(session.id); }
    catch { /* ignore */ }
  };

  const handleManagerStartClick = () => {
    const realCount = players.filter((p) => !p.isSpectator).length;
    if (realCount < 2) return;
    if (session!.questionMode === 'MANUAL' && session!.totalQuestions === 0) return;
    setShowStartConfirm(true);
  };

  const handleStartWithAdjustedQ = async () => {
    if (!session?.id) return;
    setIsSavingConfig(true);
    try {
      await sessionsApi.updateSessionConfig(session.id, { questionsPerCategory: adjustedQPerCat });
      await fetchSession(session.id);
    } catch { /* proceed */ }
    finally { setIsSavingConfig(false); }
    setShowQLimit(false);
    try { await startSession(session.id); }
    catch (err: any) { window.alert(err?.message || 'Impossible de démarrer la partie'); }
  };

  const handleLeave = () => {
    if (window.confirm('Voulez-vous vraiment quitter cette session ?')) {
      const roomId = session?.roomId;
      leaveSession();
      if (roomId) router.replace(`/room/${roomId}`); else router.replace('/');
    }
  };

  const handleDeleteSession = async () => {
    if (!session?.id || isDeletingSession) return;
    if (window.confirm('Supprimer la session ? Cette action est irréversible. Tous les joueurs seront expulsés.')) {
      setIsDeletingSession(true);
      try { await deleteSession(session.id); router.replace('/'); }
      catch (err: any) { window.alert(err?.message || 'Impossible de supprimer la session'); setIsDeletingSession(false); }
    }
  };

  const handleKickPlayer = async (playerId: string, playerName: string) => {
    if (!session?.id || kickingPlayerId) return;
    if (window.confirm(`Voulez-vous vraiment retirer ${playerName} de la session ?`)) {
      setKickingPlayerId(playerId);
      try { await sessionsApi.removePlayer(session.id, playerId); }
      catch (err: any) { window.alert(err?.message || "Impossible d'expulser le joueur"); }
      finally { setKickingPlayerId(null); }
    }
  };

  const handleEditCategories = (player: PlayerResponse) => {
    router.push(`/session/${code}/categories?playerId=${player.id}&playerName=${encodeURIComponent(player.name)}&isEditing=true&sessionId=${session?.id || ''}`);
  };

  const handleEditMyCategories = () => {
    const me = players.find((p) => p.userId === user?.id);
    if (!me) return;
    router.push(`/session/${code}/categories?playerId=${me.id}&playerName=${encodeURIComponent(me.name)}&isEditing=true&sessionId=${session?.id || ''}`);
  };

  const handleAssignTeam = async (playerId: string, teamId: string) => {
    if (!session?.id) return;
    setIsChangingTeam(true);
    try {
      await sessionsApi.changePlayerTeam(session.id, playerId, teamId);
      await fetchSession(session.id);
    } catch (err: any) {
      window.alert(err?.response?.data?.message || "Impossible de changer d'équipe");
    } finally {
      setIsChangingTeam(false);
      setShowTeamPicker(false);
      setTeamPickerTargetPlayer(null);
    }
  };

  const handleChangeTeam = () => {
    if (!currentPlayer) return;
    setTeamPickerTargetPlayer({ id: currentPlayer.id, name: currentPlayer.name });
    setShowTeamPicker(true);
  };

  const handleManagerReassign = (playerId: string, playerName: string) => {
    setTeamPickerTargetPlayer({ id: playerId, name: playerName });
    setShowTeamPicker(true);
  };

  const handleRefresh = async () => {
    if (!session?.id) return;
    setIsRefreshing(true);
    await fetchSession(session.id);
    setIsRefreshing(false);
  };

  const managerPlayer = players.find((p) => p.isManager);
  const realPlayerCount = players.filter((p) => !p.isSpectator).length;
  const canStart = realPlayerCount >= 2 && (session?.questionMode !== 'MANUAL' || (session?.totalQuestions ?? 0) > 0);
  const isWithoutModerator = session?.sessionMode === 'WITHOUT_MODERATOR';
  const totalQuestionsEstimate = (session?.maxCategoriesPerPlayer ?? 1) * (session?.questionsPerCategory ?? 1) * Math.max(1, realPlayerCount);

  const CATEGORY_EMOJI: Record<string, string> = {
    Histoire: '📜', Science: '🔬', Sports: '🏆', Géographie: '🌍',
    'Culture G': '🌐', Cinéma: '🎬',
  };

  const handleSendCategoryRequest = () => {
    if (reqText.trim().length < 3) return;
    setReqSent(true);
    setTimeout(() => {
      setReqOpen(false);
      setReqSent(false);
      setReqText('');
    }, 1600);
  };

  // ── Loading ──
  if (!session) {
    return (
      <SafeScreen>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-16 h-16 rounded-full bg-accent/13 border border-accent/30 flex items-center justify-center mb-4">
            <Gamepad2 size={30} className="text-accent" />
          </div>
          <p className={`${orbitron.className} text-accent text-sm font-bold tracking-widest`}>
            CHARGEMENT…
          </p>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm border-b border-line px-4 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { if (session?.roomId) router.replace(`/room/${session.roomId}`); else router.replace('/'); }}
            className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} className="text-txt" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className={`${orbitron.className} text-txt text-base font-bold tracking-wide`}>
              Salon d&apos;attente
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-accent' : 'bg-buzz'}`} />
              <span className={`text-[10px] font-semibold tracking-wider ${isConnected ? 'text-accent/80' : 'text-buzz/80'}`}>
                {isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
              </span>
              {roomInfo && (
                <span className="text-txt-40 text-[10px] truncate">· {roomInfo.name}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-buzz/12 border border-buzz/40 text-buzz text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-buzz animate-pulse" />
              LIVE
            </span>
            {isManager && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-energy/12 border border-energy/40 text-energy text-[10px] font-bold">
                <Crown size={10} fill="#FFD700" color="#FFD700" />
                HOST
              </span>
            )}
            <span className={`${orbitron.className} px-2 py-1 rounded-lg bg-surface border border-line text-txt text-[10px] font-bold tracking-widest`}>
              {code}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center"
            >
              <RefreshCw size={13} className={`text-txt ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="overflow-y-auto pb-8 px-4">

        {/* ── Hero ── */}
        <div className="text-center mt-4 mb-4 animate-[pop_0.5s_both]">
          <div className="inline-flex justify-center">
            <Avatar
              avatarUrl={currentPlayer?.userId ? (avatarMap[currentPlayer.userId] ?? currentPlayer.avatarUrl) : user?.avatarUrl}
              username={currentPlayer?.name ?? user?.username ?? 'Joueur'}
              size={74}
              borderColor="#00D397"
            />
          </div>
          <h2 className="text-txt text-[23px] font-bold mt-3">Tu es dans la partie !</h2>
          <p className="text-txt-60 text-sm mt-1">
            Salut <strong className="text-txt">{currentPlayer?.name ?? user?.username}</strong> — garde ton pouce prêt
          </p>
        </div>

        {/* ── Mode badges ── */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isWithoutModerator ? 'bg-host/12 border-host/30 text-host' : 'bg-energy/12 border-energy/30 text-energy'
          }`}>
            <Crown size={12} />
            {isWithoutModerator ? 'Sans modérateur' : 'Avec modérateur'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/12 border border-accent/30 text-accent">
            <Zap size={12} />
            {session.questionMode === 'MANUAL' ? `${session.totalQuestions} questions` : `~${totalQuestionsEstimate} questions`}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface border border-line text-txt-60">
            <Users size={12} />
            {players.length}/{session.maxPlayers}
          </span>
        </div>

        {/* ── Share code ── */}
        <div className="bg-surface rounded-2xl border border-line p-3.5 mb-4">
          <p className={`${orbitron.className} text-accent text-3xl font-black tracking-[0.2em] text-center mb-3`}>{code}</p>
          <div className="flex gap-2">
            <button type="button" onClick={handleCopyCode} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-2 border border-line text-txt text-sm font-semibold">
              {isCopied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
              {isCopied ? 'Copié' : 'Copier'}
            </button>
            <button type="button" onClick={handleShare} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-semibold">
              <Share2 size={14} />
              Partager
            </button>
            <button type="button" onClick={() => setShowQRModal(true)} className="px-3 py-2.5 rounded-xl bg-energy/10 border border-energy/30">
              <QrCode size={16} className="text-energy" />
            </button>
          </div>
        </div>

        {/* ── Mes catégories ── */}
        {!currentPlayer?.isSpectator && session.questionMode !== 'MANUAL' && (
          <div className="bg-surface rounded-2xl border border-line p-3.5 mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-host text-[10px] font-bold tracking-widest uppercase">Mes catégories</span>
              <button
                type="button"
                onClick={handleEditMyCategories}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-host/16 border border-host/30 text-host"
              >
                ✎ Modifier
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(currentPlayer?.selectedCategories ?? []).map((cat) => (
                <span key={cat} className="px-2 py-1 rounded-full bg-bg border border-line text-txt text-xs">
                  {CATEGORY_EMOJI[cat] ? `${CATEGORY_EMOJI[cat]} ` : ''}{cat}
                </span>
              ))}
              {(currentPlayer?.selectedCategories?.length ?? 0) === 0 && (
                <span className="text-txt-40 text-xs">Aucune catégorie sélectionnée</span>
              )}
              <button
                type="button"
                onClick={() => setReqOpen((v) => !v)}
                className="px-2 py-1 rounded-full border border-dashed border-line text-txt-60 text-xs hover:bg-surface-2 transition-colors"
              >
                + Demander
              </button>
            </div>
            {reqOpen && (
              <div className="mt-3 flex flex-col gap-2 animate-[rise_0.25s_both]">
                {reqSent ? (
                  <div className="flex items-center gap-2 text-accent text-sm">
                    <Check size={14} />
                    Demande envoyée à l&apos;hôte
                  </div>
                ) : (
                  <>
                    <input
                      value={reqText}
                      onChange={(e) => setReqText(e.target.value)}
                      placeholder="Suggère une catégorie à l'hôte…"
                      className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-txt text-sm outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      disabled={reqText.trim().length < 3}
                      onClick={handleSendCategoryRequest}
                      className="w-full py-2.5 rounded-xl bg-accent text-btn-fg font-bold text-sm disabled:opacity-40"
                    >
                      Envoyer la demande
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Waiting (non-manager) ── */}
        {!isManager && (
          <div className="bg-surface rounded-2xl border border-buzz/25 p-4 mb-4 text-center relative overflow-hidden">
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-buzz animate-pulse"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
            <p className={`${orbitron.className} text-txt text-lg font-bold tracking-wide`}>
              En attente <span className="text-buzz">du host</span>
            </p>
            {managerPlayer && (
              <div className="flex items-center justify-center gap-2.5 mt-3 p-2.5 rounded-xl bg-energy/10 border border-energy/25">
                <Crown size={16} className="text-energy" fill="#FFD700" />
                <Avatar avatarUrl={managerPlayer.avatarUrl} username={managerPlayer.name} size={36} borderColor="#FFD700" />
                <div className="text-left">
                  <p className="text-energy font-bold text-sm">{managerPlayer.name}</p>
                  <p className="text-txt-40 text-[10px] tracking-wider">HOST DE LA PARTIE</p>
                </div>
              </div>
            )}
            <p className="text-txt-60 text-xs mt-3">La partie démarre dès que le manager lance</p>
            {(currentPlayer?.selectedCategories?.length ?? 0) === 0 && !currentPlayer?.isSpectator && session.questionMode !== 'MANUAL' && (
              <button
                type="button"
                onClick={handleEditMyCategories}
                className="w-full mt-3 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent font-bold text-sm"
              >
                Choisir vos catégories
              </button>
            )}
          </div>
        )}

        {/* ── MANAGER CONTROLS ── */}
        {isManager && (
          <div className="mb-4">
            {/* Manual questions alert */}
            {session.questionMode === 'MANUAL' && (
              <ManualQuestionsAlert
                totalQuestions={session.totalQuestions}
                sessionId={session.id}
                code={code || ''}
                onNavigate={() => router.push(`/session/${code}/questions?sessionId=${session.id}`)}
              />
            )}

            {/* BIG START BUTTON */}
            <button
              type="button"
              onClick={handleManagerStartClick}
              disabled={isStarting || !canStart}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-2.5 mb-2.5 transition-all ${
                canStart && !isStarting
                  ? 'bg-accent hover:bg-accent-d shadow-glow-success'
                  : 'bg-surface-2 border border-line cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <>
                  <div className="w-5 h-5 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
                  <span className={`${orbitron.className} text-btn-fg text-lg font-bold`}>DÉMARRAGE…</span>
                </>
              ) : (
                <>
                  <span className="dotpulse" style={{ background: canStart ? '#08231B' : 'var(--txt-40)' }} />
                  <Play size={20} className={canStart ? 'text-btn-fg' : 'text-txt-40'} fill="currentColor" />
                  <span className={`${orbitron.className} text-lg font-bold tracking-wide ${canStart ? 'text-btn-fg' : 'text-txt-40'}`}>
                    Lancer la partie
                  </span>
                </>
              )}
            </button>

            {!canStart && !isStarting && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px 0 6px', marginBottom: 8 }}>
                <AlertCircle size={13} color="#FF3A5C" />
                <span className={rajdhani.className} style={{ fontSize: 13, color: '#FF3A5C' }}>Minimum 2 joueurs requis</span>
              </div>
            )}

            {/* Secondary actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleLeave}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
                  background: '#FF3A5C12', border: '1px solid #FF3A5C30',
                }}
              >
                <LogOut size={15} color="#FF3A5C" />
                <span className={rajdhani.className} style={{ fontSize: 13, fontWeight: 600, color: '#FF3A5C' }}>Quitter</span>
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={isDeletingSession}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
                  background: '#FF3A5C12', border: '1px solid #FF3A5C30',
                }}
              >
                {isDeletingSession ? (
                  <div style={{ width: 14, height: 14, border: '2px solid #FF3A5C', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                ) : (
                  <Trash2 size={15} color="#FF3A5C" />
                )}
                <span className={rajdhani.className} style={{ fontSize: 13, fontWeight: 600, color: '#FF3A5C' }}>Supprimer</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TEAMS ── */}
        {session.isTeamMode && teams.length > 0 && (
          <ArcadeTeamsSection
            teams={teams}
            currentPlayerId={currentPlayer?.id ?? null}
            isManager={isManager}
            userId={user?.id}
            avatarMap={avatarMap}
            onChangeTeam={handleChangeTeam}
            onManagerReassign={handleManagerReassign}
            orbitronClass={orbitron.className}
            rajdhaniClass={rajdhani.className}
          />
        )}

        {/* ── Players grid ── */}
        <div className="bg-surface rounded-2xl border border-line p-3.5 mb-4 flex flex-col min-h-[180px]">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-txt-40 text-[10px] font-bold tracking-widest uppercase">Joueurs connectés</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-2 text-txt text-xs font-semibold">{players.length}</span>
          </div>

          {players.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[280px]">
              {players.map((player) => {
                const isYou = player.userId === user?.id;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setSelectedLobbyPlayer(player)}
                    className="flex flex-col items-center gap-1.5 p-0 bg-transparent border-0 cursor-pointer animate-[pop_0.35s_both]"
                  >
                    <div className="relative">
                      {player.isSpectator ? (
                        <div className="w-[46px] h-[46px] rounded-full bg-energy/12 border-2 border-energy/40 flex items-center justify-center">
                          <Eye size={16} className="text-energy" />
                        </div>
                      ) : (
                        <Avatar
                          avatarUrl={player.userId ? (avatarMap[player.userId] ?? player.avatarUrl) : player.avatarUrl}
                          username={player.name}
                          size={46}
                          borderColor={player.isManager ? '#FFD700' : isYou ? '#00D397' : undefined}
                        />
                      )}
                      {player.isManager && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                          <Crown size={11} fill="#FFD700" color="#FFD700" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[11.5px] font-semibold w-full text-center truncate ${isYou ? 'text-txt' : 'text-txt-60'}`}>
                      {isYou ? 'Toi' : player.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 border border-dashed border-line rounded-xl">
              <Users size={28} className="text-txt-25" />
              <p className="text-txt-40 text-xs mt-2 tracking-wider">En attente de joueurs…</p>
            </div>
          )}

          {/* Manager player actions */}
          {isManager && players.length > 0 && (
            <div className="mt-3 pt-3 border-t border-line flex flex-col gap-2">
              {players.filter((p) => p.userId !== user?.id).map((player) => (
                <div key={`actions-${player.id}`} className="flex items-center gap-2">
                  <span className="text-txt text-xs font-medium flex-1 truncate">{player.name}</span>
                  {session.questionMode !== 'MANUAL' && session.sessionMode === 'WITH_MODERATOR' && !player.isManager && (
                    <button type="button" onClick={() => handleEditCategories(player)} className="px-2 py-1 rounded-lg bg-host/12 text-host text-[10px] font-semibold">
                      Catégories
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleKickPlayer(player.id, player.name)}
                    disabled={kickingPlayerId === player.id}
                    className="w-7 h-7 rounded-lg bg-buzz/10 border border-buzz/25 flex items-center justify-center"
                  >
                    {kickingPlayerId === player.id ? (
                      <div className="w-3 h-3 border-2 border-buzz border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={12} className="text-buzz" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Non-manager quit ── */}
        {!isManager && (
          <button
            type="button"
            onClick={handleLeave}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-buzz/10 border border-buzz/30 text-buzz font-bold text-sm mb-2"
          >
            <DoorOpen size={16} />
            Quitter la session
          </button>
        )}

        {!isManager && (
          <p className="text-txt-40 text-[11.5px] text-center mb-2">
            L&apos;hôte démarre quand tout le monde est prêt
          </p>
        )}
      </div>

      {/* ── Question Limit Modal ── */}
      {showQLimit && session && (
        <div className="fixed inset-0 bg-scrim flex items-center justify-center z-50 p-5 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-3xl overflow-hidden bg-surface border border-buzz/20 shadow-2xl">
            <div className="px-5 pt-[18px] pb-3.5 border-b border-line flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[11px] bg-buzz/10 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-buzz" />
              </div>
              <div>
                <p className={`${orbitron.className} text-txt font-bold text-[15px]`}>Limite dépassée</p>
                <p className={`${rajdhani.className} text-txt-40 text-[11px]`}>Le total de questions dépasse 60</p>
              </div>
            </div>
            <div className="px-5 py-4">
              {(() => {
                const realPlayers = session.sessionMode !== 'WITH_MODERATOR'
                  ? players.filter((p) => !p.isSpectator).length
                  : players.filter((p) => !p.isSpectator && !p.isManager).length;
                const cats = session.maxCategoriesPerPlayer ?? 1;
                const totalCurrent = cats * (session.questionsPerCategory ?? 1) * realPlayers;
                const totalAdjusted = cats * adjustedQPerCat * realPlayers;
                const maxAllowed = Math.max(1, Math.floor(Q_LIMIT / (cats * realPlayers)));
                return (
                  <>
                    <div style={{ borderRadius: 14, padding: '12px 14px', background: 'var(--bg)', marginBottom: 14 }}>
                      <p className={`${rajdhani.className} text-[9px] text-txt-40 tracking-[0.2em] mb-2.5`}>SITUATION ACTUELLE</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { val: cats, label: 'cat/joueur', color: '#C084FC' },
                          { val: null, label: '×', color: '#E8E8F025' },
                          { val: session.questionsPerCategory, label: 'Q/cat', color: '#4A90D9' },
                          { val: null, label: '×', color: '#E8E8F025' },
                          { val: realPlayers, label: 'joueurs', color: '#FFD700' },
                          { val: null, label: '=', color: '#E8E8F025' },
                          { val: totalCurrent, label: '/ 60 max', color: '#FF3A5C', bg: '#FF3A5C10' },
                        ].map((item, i) =>
                          item.val === null ? (
                            <span key={i} style={{ color: item.color, fontWeight: 700, fontSize: 14 }}>{item.label}</span>
                          ) : (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px', borderRadius: 9, background: item.bg ?? 'var(--surface)' }}>
                              <span style={{ color: item.color, fontWeight: 700, fontSize: 17 }}>{item.val}</span>
                              <span style={{ color: '#E8E8F038', fontSize: 9 }}>{item.label}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p className={`${rajdhani.className} text-txt font-semibold text-[13px]`}>Questions par catégorie</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAdjustedQPerCat((v) => Math.max(1, v - 1))}
                            className="w-7 h-7 rounded-lg bg-surface-2 border border-line flex items-center justify-center cursor-pointer text-txt hover:bg-surface-2/80 transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <div className="px-3 py-1 rounded-lg bg-accent/10 min-w-[44px] text-center">
                            <span className="text-accent font-bold text-base">{adjustedQPerCat}</span>
                          </div>
                          <button
                            onClick={() => setAdjustedQPerCat((v) => Math.min(maxAllowed, v + 1))}
                            className="w-7 h-7 rounded-lg bg-surface-2 border border-line flex items-center justify-center cursor-pointer text-txt hover:bg-surface-2/80 transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <Slider label="" value={adjustedQPerCat} onValueChange={setAdjustedQPerCat} min={1} max={maxAllowed} suffix="" />
                      <div className="flex justify-between mt-2">
                        <span className={`${rajdhani.className} text-[11px] text-txt-40`}>Total ajusté :</span>
                        <span className={`${rajdhani.className} text-xs font-semibold ${totalAdjusted <= Q_LIMIT ? 'text-accent' : 'text-buzz'}`}>
                          {totalAdjusted} questions
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-bg mb-4">
                      <AlertCircle size={13} className="text-energy shrink-0 mt-0.5" />
                      <p className={`${rajdhani.className} text-[11px] text-txt-40 leading-relaxed`}>
                        Max recommandé : <span className="text-txt font-semibold">{maxAllowed} Q/catégorie</span> avec {realPlayers} joueur{realPlayers > 1 ? 's' : ''}.
                      </p>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setShowQLimit(false)}
                        className="flex-1 py-3 rounded-[14px] flex items-center justify-center gap-1.5 cursor-pointer bg-surface-2 hover:bg-surface-2/80 transition-colors"
                      >
                        <X size={14} className="text-txt-40" />
                        <span className={`${rajdhani.className} text-[13px] text-txt-60 font-medium`}>Annuler</span>
                      </button>
                      <button
                        onClick={handleStartWithAdjustedQ}
                        disabled={isSavingConfig || isStarting}
                        className="flex-1 py-3 rounded-[14px] flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-br from-accent to-[#00C877] disabled:opacity-60 transition-opacity"
                      >
                        {isSavingConfig || isStarting ? (
                          <div className="w-3.5 h-3.5 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play size={14} className="text-btn-fg" fill="currentColor" />
                        )}
                        <span className={`${orbitron.className} text-[12px] font-bold text-btn-fg`}>LANCER</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── QR Modal ── */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        type="session"
        id={session?.id || ''}
        code={code}
        title={`Session de ${session?.managerName || 'Manager'}`}
      />

      {/* ── Team Picker ── */}
      {showTeamPicker && (
        <div className="fixed inset-0 bg-scrim flex items-end justify-center z-50 backdrop-blur-sm">
          <div className="rounded-t-3xl w-full max-w-[480px] bg-surface border-t border-line animate-[sheetup_.3s_ease-out_both]">
            <div className="px-5 pt-[18px] pb-3 border-b border-line flex items-center justify-between">
              <div>
                <p className={`${orbitron.className} text-txt font-bold text-[15px]`}>Changer d&apos;équipe</p>
                {teamPickerTargetPlayer && (
                  <p className={`${rajdhani.className} text-txt-40 text-[11px] mt-0.5`}>{teamPickerTargetPlayer.name}</p>
                )}
              </div>
              <button
                onClick={() => { setShowTeamPicker(false); setTeamPickerTargetPlayer(null); }}
                className="w-[34px] h-[34px] rounded-full bg-surface-2 border border-line flex items-center justify-center cursor-pointer text-txt hover:bg-surface-2/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-3 flex flex-col gap-2">
              {teams.map((team) => {
                const isCurrent = team.members.some((m) => m.id === teamPickerTargetPlayer?.id);
                return (
                  <button
                    key={team.id}
                    onClick={() => teamPickerTargetPlayer && handleAssignTeam(teamPickerTargetPlayer.id, team.id)}
                    disabled={isChangingTeam || isCurrent}
                    className="flex items-center px-4 py-3.5 rounded-[14px] cursor-pointer transition-opacity disabled:opacity-60"
                    style={{
                      background: isCurrent ? (team.color ? `${team.color}12` : 'var(--surface-2)') : 'var(--bg)',
                      border: `1px solid ${isCurrent ? (team.color ?? '#00D397') : 'var(--line)'}`,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-3 shrink-0"
                      style={{ background: team.color ?? '#3A3A5E' }}
                    />
                    <span className={`${rajdhani.className} flex-1 text-txt font-semibold text-sm text-left`}>{team.name}</span>
                    <span className={`${rajdhani.className} text-txt-40 text-xs`}>
                      {team.members.length} joueur{team.members.length !== 1 ? 's' : ''}
                    </span>
                    {isCurrent && (
                      <div className="ml-2.5 px-2 py-0.5 rounded-md bg-accent/10">
                        <span className={`${rajdhani.className} text-[11px] font-semibold text-accent`}>Actuel</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {isChangingTeam && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0' }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid #00D397', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
              </div>
            )}
            <div style={{ height: 28 }} />
          </div>
        </div>
      )}

      {/* ── Start Confirm Modal ── */}
      {/* ── Lobby Player Details Bottom Sheet ── */}
      {selectedLobbyPlayer && (
        <div className="fixed inset-0 bg-scrim flex items-end justify-center z-50 backdrop-blur-sm">
          {/* Scrim click closes modal */}
          <div className="absolute inset-0" onClick={() => setSelectedLobbyPlayer(null)} />
          
          <div className="relative rounded-t-3xl w-full max-w-[480px] bg-surface border-t border-line animate-[sheetup_.3s_ease-out_both] p-5 pb-8 z-10">
            {/* Handle bar */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1.5 rounded-full bg-surface-2" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedLobbyPlayer(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer text-txt-60"
            >
              <X size={16} />
            </button>

            {/* Profile Info */}
            <div className="flex flex-col items-center mb-6">
              <Avatar
                avatarUrl={selectedLobbyPlayer.userId ? (avatarMap[selectedLobbyPlayer.userId] ?? selectedLobbyPlayer.avatarUrl) : selectedLobbyPlayer.avatarUrl}
                username={selectedLobbyPlayer.name}
                size={72}
                borderColor={selectedLobbyPlayer.isManager ? '#FFD700' : selectedLobbyPlayer.userId === user?.id ? '#00D397' : undefined}
              />
              <h3 className="text-txt text-lg font-bold mt-3">{selectedLobbyPlayer.name}</h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                {selectedLobbyPlayer.isSpectator ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-energy/12 text-energy text-[10px] font-bold">
                    <Eye size={10} />
                    SPECTATEUR
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/12 text-accent text-[10px] font-bold">
                    JOUEUR
                  </span>
                )}
                {selectedLobbyPlayer.isManager && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-energy/12 text-energy text-[10px] font-bold">
                    <Crown size={10} fill="#FFD700" color="#FFD700" />
                    HOST
                  </span>
                )}
                {selectedLobbyPlayer.teamId && (() => {
                  const team = teams.find(t => t.id === selectedLobbyPlayer.teamId);
                  if (!team) return null;
                  return (
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: (team.color ?? '#4A90D9') + '20', color: team.color ?? '#4A90D9' }}
                    >
                      {team.name}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Selected Categories */}
            {!selectedLobbyPlayer.isSpectator && session.questionMode !== 'MANUAL' && (
              <div className="mb-6">
                <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-3 text-center">
                  Catégories choisies pour cette partie
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(selectedLobbyPlayer.selectedCategories ?? []).map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1.5 rounded-full bg-surface-2 border border-line text-txt text-sm font-medium flex items-center gap-1.5"
                    >
                      <span>{CATEGORY_EMOJI[cat] ?? '💡'}</span>
                      <span>{cat}</span>
                    </span>
                  ))}
                  {(selectedLobbyPlayer.selectedCategories ?? []).length === 0 && (
                    <p className="text-txt-40 text-sm italic py-2">Aucune catégorie sélectionnée</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {selectedLobbyPlayer.userId && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileUserId(selectedLobbyPlayer.userId);
                    setSelectedLobbyPlayer(null);
                  }}
                  className="w-full py-3 rounded-xl bg-surface-2 border border-line text-txt font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Voir les statistiques globales
                </button>
              )}
              
              {/* Manager Actions on other players */}
              {isManager && selectedLobbyPlayer.userId !== user?.id && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-line">
                  {session.questionMode !== 'MANUAL' && session.sessionMode === 'WITH_MODERATOR' && !selectedLobbyPlayer.isManager && (
                    <button
                      type="button"
                      onClick={() => {
                        handleEditCategories(selectedLobbyPlayer);
                        setSelectedLobbyPlayer(null);
                      }}
                      className="flex-1 py-3 rounded-xl bg-host/12 text-host font-semibold text-sm border border-host/20"
                    >
                      Modifier catégories
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleKickPlayer(selectedLobbyPlayer.id, selectedLobbyPlayer.name);
                      setSelectedLobbyPlayer(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-buzz/10 border border-buzz/30 text-buzz font-semibold text-sm"
                  >
                    Exclure du salon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PlayerProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />

      <ConfirmModal
        open={showStartConfirm}
        title="Démarrer la partie ?"
        message={
          session?.questionMode === 'MANUAL'
            ? `${session?.totalQuestions} question(s) prête(s). Les joueurs ne pourront plus rejoindre une fois la partie lancée.`
            : 'La génération des questions va commencer. Les joueurs ne pourront plus rejoindre une fois la partie lancée.'
        }
        confirmLabel="Démarrer"
        cancelLabel="Annuler"
        confirmColor="#00D397"
        icon={<Play size={24} color="#00D397" />}
        onConfirm={() => { setShowStartConfirm(false); handleStartGame(); }}
        onCancel={() => setShowStartConfirm(false)}
      />
    </SafeScreen>
  );
}
