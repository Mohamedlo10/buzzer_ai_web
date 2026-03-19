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
  Tag,
  QrCode,
  PenLine,
  TrendingUp,
  Minus,
  Plus,
  DoorOpen,
  Share2,
  Gamepad2,
} from 'lucide-react';
import { Orbitron, Rajdhani } from 'next/font/google';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { QRCodeModal } from '~/components/ui/QRCodeModal';
import { Avatar } from '~/components/ui/Avatar';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import { appStorage } from '~/lib/utils/storage';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { Slider } from '~/components/ui/Slider';
import type { RoomInfo, PlayerResponse, TeamResponse } from '~/types/api';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['400', '700', '900'] });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ─── ARCADE CSS ───────────────────────────────────────────────────────────────
const ARCADE_CSS = `
  .arcade-grid {
    position: absolute;
    bottom: 0;
    left: -80%;
    right: -80%;
    height: 280%;
    background-image:
      linear-gradient(rgba(255,58,92,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,58,92,0.07) 1px, transparent 1px);
    background-size: 56px 56px;
    transform: perspective(320px) rotateX(65deg);
    transform-origin: 50% 100%;
    animation: arcade-grid-scroll 5s linear infinite;
    pointer-events: none;
  }
  @keyframes arcade-grid-scroll {
    from { background-position: 0 0; }
    to   { background-position: 0 56px; }
  }
  @keyframes blink-live {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }
  @keyframes neon-code {
    0%, 100% { text-shadow: 0 0 4px #00FF88, 0 0 14px #00FF8870, 0 0 28px #00FF8840; }
    50%       { text-shadow: 0 0 8px #00FF88, 0 0 22px #00FF88,   0 0 44px #00FF8860; }
  }
  @keyframes dot-pop {
    0%, 80%, 100% { transform: scale(0.55); opacity: 0.25; }
    40%           { transform: scale(1.5);  opacity: 1; }
  }
  @keyframes crown-float {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-5px);  }
  }
  @keyframes ambient-throb {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 0.65; }
  }
  @keyframes you-glow {
    0%, 100% { box-shadow: 0 0 0 1px #00FF88, 0 0 14px #00FF8820, inset 0 0 12px #00FF8806; }
    50%       { box-shadow: 0 0 0 2px #00FF88, 0 0 28px #00FF8840, inset 0 0 22px #00FF8810; }
  }
  .a-blink     { animation: blink-live    1.1s ease-in-out infinite; }
  .a-neon-code { animation: neon-code     2.5s ease-in-out infinite; }
  .a-dot-pop   { animation: dot-pop       1.4s ease-in-out infinite; }
  .a-crown     { animation: crown-float   2s   ease-in-out infinite; }
  .a-ambient   { animation: ambient-throb 3s   ease-in-out infinite; }
  .a-you-glow  { animation: you-glow      2s   ease-in-out infinite; }
  .scanline {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent, transparent 2px,
      rgba(0,255,136,0.018) 2px,
      rgba(0,255,136,0.018) 4px
    );
    pointer-events: none;
    border-radius: inherit;
  }
`;

// ─── ArcadePlayerCard ─────────────────────────────────────────────────────────
function ArcadePlayerCard({
  player,
  isCurrentUser,
  isSessionManager,
  onKick,
  onEditCategories,
  onEditSelf,
  isKicking,
}: {
  player: PlayerResponse;
  isCurrentUser: boolean;
  isSessionManager: boolean;
  onKick?: (id: string, name: string) => void;
  onEditCategories?: (p: PlayerResponse) => void;
  onEditSelf?: () => void;
  isKicking?: boolean;
}) {
  return (
    <div
      className={isCurrentUser ? 'a-you-glow' : ''}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 16,
        marginBottom: 10,
        border: `1px solid ${isCurrentUser ? '#00FF88' : player.isManager ? '#FFD700' : '#1A1A2E'}`,
        background: isCurrentUser
          ? 'linear-gradient(135deg, #001A0E 0%, #080810 100%)'
          : player.isManager
          ? 'linear-gradient(135deg, #150F00 0%, #080810 100%)'
          : '#0D0D1A',
      }}
    >
      {/* Hexagon avatar */}
      <div style={{ position: 'relative', marginRight: 12, flexShrink: 0 }}>
        <div
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            width: 52,
            height: 52,
            padding: 2,
            background: player.isManager
              ? 'linear-gradient(135deg, #FFD700, #FF8C42)'
              : isCurrentUser
              ? 'linear-gradient(135deg, #00FF88, #00B377)'
              : 'linear-gradient(135deg, #3A3A5E, #1E1E30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              width: '100%',
              height: '100%',
              background: '#080810',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {player.isSpectator ? (
              <Eye size={18} color="#FFD700" />
            ) : (
              <Avatar avatarUrl={player.avatarUrl} username={player.name} size={46} />
            )}
          </div>
        </div>
        {player.isManager && (
          <div
            className="a-crown"
            style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)' }}
          >
            <Crown size={12} color="#FFD700" fill="#FFD700" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <span
            className={rajdhani.className}
            style={{
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 0.4,
              color: isCurrentUser ? '#00FF88' : player.isManager ? '#FFD700' : '#E8E8F0',
            }}
          >
            {player.name}
          </span>
          {isCurrentUser && (
            <span
              className={rajdhani.className}
              style={{
                fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                background: '#00FF8818', color: '#00FF88', border: '1px solid #00FF8840', letterSpacing: 1,
              }}
            >
              VOUS
            </span>
          )}
          {player.isManager && (
            <span
              className={rajdhani.className}
              style={{
                fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                background: '#FFD70018', color: '#FFD700', border: '1px solid #FFD70040', letterSpacing: 1,
              }}
            >
              HOST
            </span>
          )}
          {player.isSpectator && (
            <span
              className={rajdhani.className}
              style={{
                fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                background: '#4A90D918', color: '#4A90D9', border: '1px solid #4A90D940', letterSpacing: 1,
              }}
            >
              SPECTATEUR
            </span>
          )}
        </div>

        {!player.isSpectator && player.selectedCategories?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {player.selectedCategories.map((cat) => (
              <span
                key={cat}
                className={rajdhani.className}
                style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 999,
                  background: '#1A1A2E', color: '#8B7FC7', border: '1px solid #2A2A4E',
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {isSessionManager && !isCurrentUser && (
        <div style={{ display: 'flex', gap: 7, marginLeft: 8 }}>
          {onEditCategories && (
            <button
              onClick={() => onEditCategories(player)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#1A1A2E', border: '1px solid #2A2A4E',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Tag size={13} color="#8B5CF6" />
            </button>
          )}
          {onKick && (
            <button
              onClick={() => onKick(player.id, player.name)}
              disabled={isKicking}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#FF3A5C10', border: '1px solid #FF3A5C28',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: isKicking ? 0.5 : 1,
              }}
            >
              {isKicking ? (
                <div style={{ width: 13, height: 13, border: '2px solid #FF3A5C', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
              ) : (
                <Trash2 size={13} color="#FF3A5C" />
              )}
            </button>
          )}
        </div>
      )}
      {isCurrentUser && onEditSelf && (
        <button
          onClick={onEditSelf}
          style={{
            width: 32, height: 32, borderRadius: 8, marginLeft: 8,
            background: '#1A1A2E', border: '1px solid #2A2A4E',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Tag size={13} color="#8B5CF6" />
        </button>
      )}
    </div>
  );
}

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
    <div style={{ borderRadius: 14, background: '#0D0D1A', border: '1px solid #FFD70025', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FFD70015', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PenLine size={16} color="#FFD700" />
          </div>
          <div>
            <p style={{ color: '#E8E8F0', fontWeight: 700, fontSize: 13 }}>Questions manuelles</p>
            <p style={{ color: '#e8e8f087', fontSize: 11 }}>
              {has ? `${totalQuestions} question(s) prête(s)` : 'Aucune question saisie'}
            </p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          style={{
            padding: '6px 12px', borderRadius: 9,
            background: '#FFD70015', border: '1px solid #FFD70030',
            color: '#FFD700', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {has ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
      {!has && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 9, background: '#FF3A5C0C', border: '1px solid #FF3A5C20' }}>
            <AlertCircle size={12} color="#FF3A5C" />
            <span style={{ color: '#FF3A5C', fontSize: 11 }}>Ajoutez des questions avant de démarrer</span>
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
  onChangeTeam,
  onManagerReassign,
  orbitronClass,
  rajdhaniClass,
}: {
  teams: TeamResponse[];
  currentPlayerId: string | null;
  isManager: boolean;
  userId?: string;
  onChangeTeam: () => void;
  onManagerReassign: (id: string, name: string) => void;
  orbitronClass: string;
  rajdhaniClass: string;
}) {
  return (
    <div style={{ padding: '20px 16px 0' }}>
      <div style={{ borderRadius: 18, overflow: 'hidden', background: '#0D0D1A', border: '1px solid #1A1A2E' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={14} color="#4A90D9" />
            <span className={orbitronClass} style={{ color: '#E8E8F070', fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>ÉQUIPES</span>
          </div>
          {!isManager && (
            <button
              onClick={onChangeTeam}
              style={{ padding: '5px 11px', borderRadius: 8, background: '#4A90D912', border: '1px solid #4A90D928', color: '#4A90D9', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              Changer
            </button>
          )}
        </div>
        {teams.map((team, idx) => (
          <div key={team.id} style={{ borderBottom: idx < teams.length - 1 ? '1px solid #1A1A2E' : 'none' }}>
            <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: team.color ?? '#3A3A5E', boxShadow: `0 0 5px ${team.color ?? '#3A3A5E'}` }} />
              <span className={rajdhaniClass} style={{ flex: 1, color: '#E8E8F0', fontWeight: 600, fontSize: 14 }}>{team.name}</span>
              <span className={rajdhaniClass} style={{ color: '#E8E8F038', fontSize: 12 }}>{team.members.length} joueur{team.members.length !== 1 ? 's' : ''}</span>
            </div>
            {team.members.map((member) => {
              const isMe = member.id === currentPlayerId;
              return (
                <div key={member.id} style={{ padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 10, background: isMe ? '#00FF8806' : 'transparent' }}>
                  <Avatar avatarUrl={member.avatarUrl} username={member.name} size={26} borderColor={isMe ? '#00FF88' : undefined} />
                  <span className={rajdhaniClass} style={{ flex: 1, fontSize: 13, color: isMe ? '#00FF88' : '#E8E8F070', fontWeight: isMe ? 600 : 400 }}>
                    {member.name}{isMe ? ' (vous)' : ''}
                  </span>
                  {isManager && (
                    <button
                      onClick={() => onManagerReassign(member.id, member.name)}
                      style={{ width: 26, height: 26, borderRadius: 6, background: '#1A1A2E', border: '1px solid #2A2A4E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <ChevronRight size={11} color="#E8E8F038" />
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

  const handleCopyCode = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch { /* fallback */ }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    const msg = `Rejoins ma partie BuzzMaster! Code: ${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Invitation BuzzMaster', text: msg }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(msg);
      window.alert('Lien copié dans le presse-papiers !');
    }
  };

  const Q_LIMIT = 60;

  const handleStartGame = async () => {
    if (!session?.id || !code) return;
    if (session.questionMode === 'AI') {
      const realPlayers = players.filter((p) => !p.isSpectator).length;
      const total = (session.maxCategoriesPerPlayer ?? 1) * (session.questionsPerCategory ?? 1) * realPlayers;
      if (total > Q_LIMIT) {
        const maxAllowed = Math.max(1, Math.floor(Q_LIMIT / ((session.maxCategoriesPerPlayer ?? 1) * realPlayers)));
        setAdjustedQPerCat(maxAllowed);
        setShowQLimit(true);
        return;
      }
    }
    try { await startSession(session.id); }
    catch (err: any) { window.alert(err?.message || 'Impossible de démarrer la partie'); }
  };

  const handleManagerStartClick = () => {
    const realCount = players.filter((p) => !p.isSpectator).length;
    if (realCount < 2) {
      window.alert(`Pas assez de joueurs. Minimum 2 joueurs requis (${realCount} présent)`);
      return;
    }
    if (session!.questionMode === 'MANUAL' && session!.totalQuestions === 0) {
      window.alert("Aucune question. Veuillez d'abord ajouter vos questions avant de démarrer.");
      return;
    }
    const msg = session!.questionMode === 'MANUAL'
      ? `${session!.totalQuestions} question(s) prête(s). Les joueurs ne pourront plus rejoindre. Démarrer la partie ?`
      : 'La génération des questions va commencer. Les joueurs ne pourront plus rejoindre. Démarrer la partie ?';
    if (window.confirm(msg)) handleStartGame();
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

  // ── Loading ──
  if (!session) {
    return (
      <SafeScreen style={{ backgroundColor: '#080810' }}>
        <style>{ARCADE_CSS}</style>
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div className="arcade-grid" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#00FF8815', border: '2px solid #00FF8840', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Gamepad2 size={34} color="#00FF88" />
          </div>
          <p className={orbitron.className} style={{ color: '#00FF88', fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>
            CHARGEMENT...
          </p>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={{ backgroundColor: '#080810' }}>
      <style>{ARCADE_CSS}</style>

      {/* ── Fixed Background ── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div className="arcade-grid" />
        {/* Radial fade */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 20%, #080810 85%)' }} />
        {/* Top / bottom fade */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #080810 0%, transparent 25%, transparent 70%, #080810 100%)' }} />
        {/* Edge vignette red */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 45%, #FF3A5C0A 75%, #FF3A5C16 100%)' }} />
      </div>

      {/* ── Header ── */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 20,
          padding: '24px 16px 14px',
          borderBottom: '1px solid #FF3A5C18',
          background: 'linear-gradient(to bottom, #080810 60%, transparent)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {/* Back */}
          <button
            onClick={() => { if (session?.roomId) router.replace(`/room/${session.roomId}`); else router.replace('/'); }}
            style={{
              width: 40, height: 40, borderRadius: '50%', marginRight: 12,
              background: '#FF3A5C12', border: '1px solid #FF3A5C35',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} color="#FF3A5C" />
          </button>

          {/* Title */}
          <div style={{ flex: 1 }}>
            <h1
              className={orbitron.className}
              style={{ color: '#E8E8F0', fontSize: 18, fontWeight: 900, letterSpacing: 2, margin: 0 }}
            >
              MATCH EN ATTENTE
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#00FF88' : '#FF3A5C', boxShadow: isConnected ? '0 0 6px #00FF88' : '0 0 6px #FF3A5C' }} />
              <span
                className={rajdhani.className}
                style={{ fontSize: 10, letterSpacing: 2, color: isConnected ? '#00FF8890' : '#FF3A5C90', fontWeight: 600 }}
              >
                {isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
              </span>
            </div>
          </div>

          {/* LIVE badge */}
          <div
            className="a-blink"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 7, marginRight: 8,
              background: '#FF3A5C18', border: '1px solid #FF3A5C',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3A5C', boxShadow: '0 0 4px #FF3A5C' }} />
            <span className={orbitron.className} style={{ fontSize: 10, fontWeight: 700, color: '#FF3A5C', letterSpacing: 1 }}>LIVE</span>
          </div>

          {/* Manager badge */}
          {isManager && (
            <div
              className="a-crown"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 7, marginRight: 8,
                background: '#FFD70015', border: '1px solid #FFD700',
              }}
            >
              <Crown size={11} color="#FFD700" fill="#FFD700" />
              <span className={orbitron.className} style={{ fontSize: 10, fontWeight: 700, color: '#FFD700', letterSpacing: 1 }}>HOST</span>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#1A1A2E', border: '1px solid #2A2A4E',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} color={isRefreshing ? '#00FF88' : '#E8E8F050'} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{ position: 'relative', zIndex: 10, overflowY: 'auto', paddingBottom: 32 }}>

        {/* ── SESSION CODE — Terminal ── */}
        <div style={{ padding: '20px 16px 0' }}>
          <div
            style={{
              borderRadius: 18, overflow: 'hidden', position: 'relative',
              background: '#070D07',
              border: '1px solid #00FF8828',
              boxShadow: '0 0 40px #00FF8808, inset 0 0 30px #00FF8804',
            }}
          >
            <div className="scanline" />
            <div style={{ padding: '16px 18px', position: 'relative', zIndex: 1 }}>
              {/* Terminal dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#FF3A5C', '#FFD700', '#00FF88'].map((c) => (
                    <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span className={rajdhani.className} style={{ color: '#00FF8855', fontSize: 10, letterSpacing: 2 }}>
                  SESSION_CODE.exe
                </span>
              </div>

              {/* Code */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <span className={rajdhani.className} style={{ color: '#00FF8855', fontSize: 13, letterSpacing: 1 }}>&gt;_</span>
                <span
                  className={`${orbitron.className} a-neon-code`}
                  style={{ fontSize: 46, fontWeight: 900, letterSpacing: 8, color: '#00FF88' }}
                >
                  {code}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopyCode}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 0', borderRadius: 11, cursor: 'pointer',
                    background: isCopied ? '#00FF8818' : '#1A1A2E',
                    border: `1px solid ${isCopied ? '#00FF8850' : '#2A2A4E'}`,
                  }}
                >
                  {isCopied ? <Check size={15} color="#00FF88" /> : <Copy size={15} color="#E8E8F060" />}
                  <span className={rajdhani.className} style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, color: isCopied ? '#00FF88' : '#E8E8F060' }}>
                    {isCopied ? 'COPIÉ' : 'COPIER'}
                  </span>
                </button>
                <button
                  onClick={handleShare}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 0', borderRadius: 11, cursor: 'pointer',
                    background: '#00FF8812', border: '1px solid #00FF8838',
                  }}
                >
                  <Share2 size={15} color="#00FF88" />
                  <span className={rajdhani.className} style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, color: '#00FF88' }}>PARTAGER</span>
                </button>
                <button
                  onClick={() => setShowQRModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '10px 14px', borderRadius: 11, cursor: 'pointer',
                    background: '#FFD70010', border: '1px solid #FFD70028',
                  }}
                >
                  <QrCode size={16} color="#FFD700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── PLAYER COUNT BAR ── */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ borderRadius: 16, padding: '14px 18px', background: '#0D0D1A', border: '1px solid #1A1A2E' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className={orbitron.className} style={{ fontSize: 9, fontWeight: 700, color: '#e8e8f0e8', letterSpacing: 2 }}>
                JOUEURS CONNECTÉS
              </span>
              <span className={orbitron.className} style={{ fontSize: 14, fontWeight: 900 }}>
                <span style={{ color: '#00FF88' }}>{players.length}</span>
                <span style={{ color: '#E8E8F025' }}> / {session.maxPlayers}</span>
              </span>
            </div>

            {/* Bar */}
            <div style={{ width: '100%', height: 5, borderRadius: 999, background: '#1A1A2E', marginBottom: 12, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', borderRadius: 999,
                  width: `${(players.length / session.maxPlayers) * 100}%`,
                  background: 'linear-gradient(90deg, #00FF88, #00C877)',
                  boxShadow: '0 0 8px #00FF8850',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>

            {/* Avatars */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              {players.map((p) => (
                <div
                  key={p.id}
                  title={p.name}
                  style={{
                    borderRadius: '50%',
                    border: `2px solid ${p.isManager ? '#FFD700' : p.userId === user?.id ? '#00FF88' : '#2A2A4E'}`,
                    boxShadow: p.isManager ? '0 0 6px #FFD70040' : p.userId === user?.id ? '0 0 6px #00FF8840' : 'none',
                  }}
                >
                  {p.isSpectator ? (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFD70012', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={12} color="#FFD700" />
                    </div>
                  ) : (
                    <Avatar avatarUrl={p.avatarUrl} username={p.name} size={28} />
                  )}
                </div>
              ))}
              {Array.from({ length: Math.min(5, Math.max(0, session.maxPlayers - players.length)) }).map((_, i) => (
                <div key={`slot-${i}`} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px dashed #1E1E2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E1E2E' }} />
                </div>
              ))}
              {session.maxPlayers - players.length > 5 && (
                <span className={rajdhani.className} style={{ color: '#e8e8f06e', fontSize: 11 }}>+{session.maxPlayers - players.length - 5} slots</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Room info ── */}
        {roomInfo && (
          <div style={{ padding: '10px 16px 0' }}>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: '#0D0D1A', border: '1px solid #1A1A2E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hash size={12} color="#E8E8F030" />
              <span className={rajdhani.className} style={{ fontSize: 13, color: '#e8e8f0f5' }}>Salle :</span>
              <span className={rajdhani.className} style={{ fontSize: 13, fontWeight: 600, color: '#00FF88' }}>{roomInfo.name}</span>
            </div>
          </div>
        )}

        {/* ── WAITING BLOCK (non-manager) ── */}
        {!isManager && (
          <div style={{ padding: '18px 16px 0' }}>
            <div
              style={{
                borderRadius: 20, padding: '22px 18px', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, #1A0810 0%, #080810 100%)',
                border: '1px solid #FF3A5C22',
              }}
            >
              {/* Ambient glow */}
              <div
                className="a-ambient"
                style={{
                  position: 'absolute', inset: 0, borderRadius: 20,
                  background: 'radial-gradient(ellipse at center, #FF3A5C09 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Pulsing dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="a-dot-pop"
                      style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: '#FF3A5C', boxShadow: '0 0 8px #FF3A5C',
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Main text */}
                <p
                  className={orbitron.className}
                  style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, letterSpacing: 2, color: '#E8E8F0', lineHeight: 1.2, marginBottom: 16 }}
                >
                  EN ATTENTE<br />
                  <span style={{ color: '#FF3A5C' }}>DU HOST</span>
                </p>

                {/* Manager star player */}
                {managerPlayer && (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 14, marginBottom: 14,
                      background: '#FFD7000C', border: '1px solid #FFD70022',
                    }}
                  >
                    <div className="a-crown">
                      <Crown size={18} color="#FFD700" fill="#FFD700" />
                    </div>
                    <div
                      style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        width: 40, height: 40, padding: 2,
                        background: 'linear-gradient(135deg, #FFD700, #FF8C42)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          width: '100%', height: '100%',
                          background: '#1A0810', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        }}
                      >
                        <Avatar avatarUrl={managerPlayer.avatarUrl} username={managerPlayer.name} size={36} />
                      </div>
                    </div>
                    <div>
                      <p className={orbitron.className} style={{ color: '#FFD700', fontSize: 15, fontWeight: 900, letterSpacing: 1 }}>
                        {managerPlayer.name}
                      </p>
                      <p className={rajdhani.className} style={{ color: '#FFD70065', fontSize: 10, letterSpacing: 1 }}>HOST DE LA PARTIE</p>
                    </div>
                  </div>
                )}

                <p className={rajdhani.className} style={{ textAlign: 'center', fontSize: 13, color: '#e8e8f0d0', letterSpacing: 0.5 }}>
                  La partie démarre dès que le manager lance
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── MANAGER CONTROLS ── */}
        {isManager && (
          <div style={{ padding: '18px 16px 0' }}>
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
              onClick={handleManagerStartClick}
              disabled={isStarting}
              style={{
                width: '100%', padding: '20px 0',
                borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                cursor: isStarting ? 'not-allowed' : 'pointer',
                background: canStart ? 'linear-gradient(135deg, #00FF88 0%, #00C877 100%)' : '#1A1A2E',
                border: canStart ? 'none' : '1px solid #2A2A4E',
                boxShadow: canStart ? '0 0 40px #00FF8830, 0 6px 24px #00FF8818' : 'none',
                marginBottom: 10,
                transition: 'transform 0.15s ease',
              }}
            >
              {isStarting ? (
                <>
                  <div style={{ width: 20, height: 20, border: '2.5px solid #080810', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                  <span className={orbitron.className} style={{ fontSize: 18, fontWeight: 900, color: '#080810' }}>DÉMARRAGE...</span>
                </>
              ) : (
                <>
                  <Play size={22} color={canStart ? '#080810' : '#E8E8F028'} fill={canStart ? '#080810' : '#E8E8F028'} />
                  <span className={orbitron.className} style={{ fontSize: 18, fontWeight: 900, color: canStart ? '#080810' : '#E8E8F028', letterSpacing: 1 }}>
                    LANCER LA PARTIE
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
            onChangeTeam={handleChangeTeam}
            onManagerReassign={handleManagerReassign}
            orbitronClass={orbitron.className}
            rajdhaniClass={rajdhani.className}
          />
        )}

        {/* ── PLAYER CARDS ── */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={13} color="#E8E8F035" />
            <span className={orbitron.className} style={{ fontSize: 9, fontWeight: 700, color: '#ffffffd3', letterSpacing: 2 }}>COMBATTANTS</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #E8E8F012, transparent)' }} />
          </div>

          {players.length > 0 ? (
            players.map((player) => (
              <ArcadePlayerCard
                key={player.id}
                player={player}
                isCurrentUser={player.userId === user?.id}
                isSessionManager={isManager}
                onKick={isManager ? handleKickPlayer : undefined}
                onEditCategories={isManager && !player.isManager && session.questionMode !== 'MANUAL' ? handleEditCategories : undefined}
                onEditSelf={player.userId === user?.id && !player.isSpectator && !player.isManager && session.questionMode !== 'MANUAL' ? handleEditMyCategories : undefined}
                isKicking={kickingPlayerId === player.id}
              />
            ))
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', borderRadius: 16, border: '1px dashed #1A1A2E' }}>
              <Users size={28} color="#E8E8F018" />
              <p className={rajdhani.className} style={{ marginTop: 10, fontSize: 12, color: '#E8E8F030', letterSpacing: 2 }}>EN ATTENTE DE JOUEURS...</p>
            </div>
          )}
        </div>

        {/* ── Non-manager quit ── */}
        {!isManager && (
          <div style={{ padding: '14px 16px 0' }}>
            <button
              onClick={handleLeave}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
                background: '#FF3A5C10', border: '1px solid #FF3A5C35',
              }}
            >
              <DoorOpen size={17} color="#FF3A5C" />
              <span className={rajdhani.className} style={{ fontSize: 15, fontWeight: 700, color: '#FF3A5C', letterSpacing: 1 }}>
                QUITTER LA SESSION
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Question Limit Modal ── */}
      {showQLimit && session && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, borderRadius: 24, overflow: 'hidden', background: '#0D0D1A', border: '1px solid #FF3A5C35' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #1A1A2E', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FF3A5C12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={18} color="#FF3A5C" />
              </div>
              <div>
                <p className={orbitron.className} style={{ color: '#E8E8F0', fontWeight: 700, fontSize: 15 }}>Limite dépassée</p>
                <p className={rajdhani.className} style={{ color: '#E8E8F045', fontSize: 11 }}>Le total de questions dépasse 60</p>
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {(() => {
                const realPlayers = players.filter((p) => !p.isSpectator).length;
                const cats = session.maxCategoriesPerPlayer ?? 1;
                const totalCurrent = cats * (session.questionsPerCategory ?? 1) * realPlayers;
                const totalAdjusted = cats * adjustedQPerCat * realPlayers;
                const maxAllowed = Math.max(1, Math.floor(Q_LIMIT / (cats * realPlayers)));
                return (
                  <>
                    <div style={{ borderRadius: 14, padding: '12px 14px', background: '#080810', marginBottom: 14 }}>
                      <p className={rajdhani.className} style={{ fontSize: 9, color: '#E8E8F038', letterSpacing: 2, marginBottom: 10 }}>SITUATION ACTUELLE</p>
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
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px', borderRadius: 9, background: item.bg ?? '#0D0D1A' }}>
                              <span style={{ color: item.color, fontWeight: 700, fontSize: 17 }}>{item.val}</span>
                              <span style={{ color: '#E8E8F038', fontSize: 9 }}>{item.label}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p className={rajdhani.className} style={{ color: '#E8E8F0', fontWeight: 600, fontSize: 13 }}>Questions par catégorie</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setAdjustedQPerCat((v) => Math.max(1, v - 1))} style={{ width: 28, height: 28, borderRadius: 8, background: '#1A1A2E', border: '1px solid #2A2A4E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Minus size={13} color="#E8E8F0" />
                          </button>
                          <div style={{ padding: '4px 12px', borderRadius: 8, background: '#00FF8812', minWidth: 44, textAlign: 'center' }}>
                            <span style={{ color: '#00FF88', fontWeight: 700, fontSize: 16 }}>{adjustedQPerCat}</span>
                          </div>
                          <button onClick={() => setAdjustedQPerCat((v) => Math.min(maxAllowed, v + 1))} style={{ width: 28, height: 28, borderRadius: 8, background: '#1A1A2E', border: '1px solid #2A2A4E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Plus size={13} color="#E8E8F0" />
                          </button>
                        </div>
                      </div>
                      <Slider label="" value={adjustedQPerCat} onValueChange={setAdjustedQPerCat} min={1} max={maxAllowed} suffix="" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span className={rajdhani.className} style={{ fontSize: 11, color: '#E8E8F038' }}>Total ajusté :</span>
                        <span className={rajdhani.className} style={{ fontSize: 12, fontWeight: 600, color: totalAdjusted <= Q_LIMIT ? '#00FF88' : '#FF3A5C' }}>
                          {totalAdjusted} questions
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#080810', marginBottom: 16 }}>
                      <AlertCircle size={13} color="#FFD700" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p className={rajdhani.className} style={{ fontSize: 11, color: '#E8E8F045', lineHeight: 1.5 }}>
                        Max recommandé : <span style={{ color: '#E8E8F0', fontWeight: 600 }}>{maxAllowed} Q/catégorie</span> avec {realPlayers} joueur{realPlayers > 1 ? 's' : ''}.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setShowQLimit(false)}
                        style={{ flex: 1, padding: '13px 0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', background: '#1A1A2E' }}
                      >
                        <X size={14} color="#E8E8F040" />
                        <span className={rajdhani.className} style={{ fontSize: 13, color: '#E8E8F040', fontWeight: 500 }}>Annuler</span>
                      </button>
                      <button
                        onClick={handleStartWithAdjustedQ}
                        disabled={isSavingConfig || isStarting}
                        style={{
                          flex: 1, padding: '13px 0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer',
                          background: 'linear-gradient(135deg, #00FF88, #00C877)',
                          opacity: isSavingConfig || isStarting ? 0.6 : 1,
                        }}
                      >
                        {isSavingConfig || isStarting ? (
                          <div style={{ width: 14, height: 14, border: '2px solid #080810', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                        ) : (
                          <Play size={14} color="#080810" fill="#080810" />
                        )}
                        <span className={orbitron.className} style={{ fontSize: 12, fontWeight: 700, color: '#080810' }}>LANCER</span>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, background: '#0D0D1A', borderTop: '1px solid #1A1A2E' }}>
            <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className={orbitron.className} style={{ color: '#E8E8F0', fontWeight: 700, fontSize: 15 }}>Changer d'équipe</p>
                {teamPickerTargetPlayer && (
                  <p className={rajdhani.className} style={{ color: '#E8E8F045', fontSize: 11, marginTop: 2 }}>{teamPickerTargetPlayer.name}</p>
                )}
              </div>
              <button
                onClick={() => { setShowTeamPicker(false); setTeamPickerTargetPlayer(null); }}
                style={{ width: 34, height: 34, borderRadius: '50%', background: '#1A1A2E', border: '1px solid #2A2A4E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#E8E8F0" />
              </button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teams.map((team) => {
                const isCurrent = team.members.some((m) => m.id === teamPickerTargetPlayer?.id);
                return (
                  <button
                    key={team.id}
                    onClick={() => teamPickerTargetPlayer && handleAssignTeam(teamPickerTargetPlayer.id, team.id)}
                    disabled={isChangingTeam || isCurrent}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      background: isCurrent ? (team.color ? `${team.color}12` : '#1A1A2E') : '#080810',
                      border: `1px solid ${isCurrent ? (team.color ?? '#00FF88') : '#1A1A2E'}`,
                      opacity: isChangingTeam ? 0.6 : 1,
                    }}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: team.color ?? '#3A3A5E', marginRight: 12 }} />
                    <span className={rajdhani.className} style={{ flex: 1, color: '#E8E8F0', fontWeight: 600, fontSize: 14 }}>{team.name}</span>
                    <span className={rajdhani.className} style={{ color: '#E8E8F038', fontSize: 12 }}>{team.members.length} joueur{team.members.length !== 1 ? 's' : ''}</span>
                    {isCurrent && (
                      <div style={{ marginLeft: 10, padding: '3px 8px', borderRadius: 7, background: '#00FF8812' }}>
                        <span className={rajdhani.className} style={{ fontSize: 11, fontWeight: 600, color: '#00FF88' }}>Actuel</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {isChangingTeam && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0' }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid #00FF88', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
              </div>
            )}
            <div style={{ height: 28 }} />
          </div>
        </div>
      )}
    </SafeScreen>
  );
}
