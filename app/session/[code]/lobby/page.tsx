'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Users,
  Crown,
  Sparkles,
  Play,
  UserPlus,
  LogOut,
  Eye,
  User,
  X,
  Zap,
  Target,
  Check,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trophy,
  Hash,
  Trash2,
  Tag,
  QrCode,
  PenLine,
  PenBox,
  TrendingUp,
  Minus,
  Plus,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { QRCodeModal } from '~/components/ui/QRCodeModal';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import { useGameSocket } from '~/lib/websocket/useGameSocket';
import { appStorage } from '~/lib/utils/storage';
import * as roomsApi from '~/lib/api/rooms';
import * as sessionsApi from '~/lib/api/sessions';
import { Slider } from '~/components/ui/Slider';
import type { RoomInfo, PlayerResponse, TeamResponse } from '~/types/api';

// Player Item Component
function PlayerItem({
  player,
  isManager,
  isCurrentUser,
  isSessionManager,
  onKick,
  onEditCategories,
  onEditSelf,
  isKicking,
}: {
  player: PlayerResponse;
  isManager: boolean;
  isCurrentUser: boolean;
  isSessionManager: boolean;
  onKick?: (playerId: string, playerName: string) => void;
  onEditCategories?: (player: PlayerResponse) => void;
  onEditSelf?: () => void;
  isKicking?: boolean;
}) {
  return (
    <div
      className={`flex flex-row items-center py-3 px-4 border-b border-[#3E3666] last:border-b-0 ${isCurrentUser ? 'bg-[#00D39710]' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 ${player.isSpectator ? 'bg-[#FFD70020]' : 'bg-[#3E3666]'}`}
      >
        {player.isSpectator ? (
          <Eye size={20} color="#FFD700" />
        ) : (
          <User size={20} color="#FFFFFF" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex flex-row items-center flex-wrap">
          <span
            className={`font-semibold text-base ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}
          >
            {player.name}
          </span>
          {isManager && (
            <div className="flex flex-row items-center ml-2 px-2 py-0.5 rounded-full bg-[#FFD70020]">
              <Crown size={10} color="#FFD700" />
              <span className="text-[#FFD700] text-xs font-medium ml-1">Manager</span>
            </div>
          )}
          {player.isSpectator && (
            <div className="flex flex-row items-center ml-2 px-2 py-0.5 rounded-full bg-[#FFD70020]">
              <span className="text-[#FFD700] text-xs font-medium">Spectateur</span>
            </div>
          )}
        </div>
        {/* Category chips */}
        {!player.isSpectator && player.selectedCategories?.length > 0 && (
          <div className="flex flex-row flex-wrap gap-1 mt-1">
            {player.selectedCategories.map((cat) => (
              <div key={cat} className="px-2 py-0.5 rounded-full bg-[#3E3666]">
                <span className="text-white/60 text-xs">{cat}</span>
              </div>
            ))}
          </div>
        )}
        {player.score > 0 && (
          <span className="text-white/50 text-xs mt-0.5">{player.score} pts</span>
        )}
      </div>

      {/* Actions for manager */}
      {isSessionManager && !isCurrentUser && (
        <div className="flex flex-row gap-2">
          {onEditCategories && (
            <button
              onClick={() => onEditCategories(player)}
              className="w-8 h-8 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
            >
              <Tag size={14} color="#8B5CF6" />
            </button>
          )}
          {onKick && (
            <button
              onClick={() => onKick(player.id, player.name)}
              disabled={isKicking}
              className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors disabled:opacity-60"
            >
              {isKicking ? (
                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} color="#EF4444" />
              )}
            </button>
          )}
        </div>
      )}

      {isCurrentUser && (
        <div className="flex flex-row items-center gap-2">
          <span className="text-[#00D397] text-xs">(Vous)</span>
          {onEditSelf && (
            <button
              onClick={onEditSelf}
              className="w-8 h-8 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
            >
              <Tag size={14} color="#8B5CF6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Session Code Card Component
function SessionCodeCard({
  code,
  isCopied,
  onCopy,
  onShare,
  onShowQR,
}: {
  code: string;
  isCopied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onShowQR?: () => void;
}) {
  return (
    <div className="px-4 pt-4">
      <div className="bg-[#342D5B] p-5 rounded-3xl border border-[#3E3666] overflow-hidden">
        <div className="flex flex-row items-center mb-3">
          <Hash size={16} color="#00D397" />
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider ml-2">
            Code de session
          </span>
        </div>
        <p className="text-white text-4xl font-bold tracking-[6px] mb-5">{code}</p>

        <div className="flex flex-row gap-3">
          <button
            onClick={onCopy}
            className="flex flex-row items-center bg-[#3E3666] px-5 py-3 rounded-2xl hover:bg-[#4E4676] transition-colors"
          >
            <Copy size={18} color={isCopied ? '#00D397' : '#FFFFFF'} />
            <span className={`font-semibold ml-2 ${isCopied ? 'text-[#00D397]' : 'text-white'}`}>
              {isCopied ? 'Copié !' : 'Copier'}
            </span>
          </button>

          <button
            onClick={onShare}
            className="flex flex-row items-center bg-[#00D397] px-5 py-3 rounded-2xl hover:bg-[#00B377] transition-colors"
          >
            <Sparkles size={18} color="#292349" />
            <span className="text-[#292349] font-semibold ml-2">Partager</span>
          </button>

          {onShowQR && (
            <button
              onClick={onShowQR}
              className="flex flex-row items-center bg-[#FFD70020] border border-[#FFD70040] px-5 py-3 rounded-2xl hover:bg-[#FFD70030] transition-colors"
            >
              <QrCode size={18} color="#FFD700" />
              <span className="text-[#FFD700] font-semibold ml-2">QR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Session Info Component
function SessionInfoCard({
  session,
}: {
  session: {
    maxPlayers: number;
    debtAmount: number;
    questionsPerCategory: number;
    isTeamMode: boolean;
  };
}) {
  return (
    <div className="px-4 pt-4">
      <div className="bg-[#292349] rounded-2xl border border-[#3E3666] p-4">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center mb-2">
              <Users size={18} color="#4A90D9" />
            </div>
            <span className="text-white font-semibold">{session.maxPlayers}</span>
            <span className="text-white/50 text-xs">Joueurs max</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center mb-2">
              <Target size={18} color="#00D397" />
            </div>
            <span className="text-white font-semibold">{session.debtAmount}</span>
            <span className="text-white/50 text-xs">Pts dette</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center mb-2">
              <Zap size={18} color="#FFD700" />
            </div>
            <span className="text-white font-semibold">{session.questionsPerCategory}</span>
            <span className="text-white/50 text-xs">Q/cat</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center mb-2">
              <Trophy size={18} color="#9B59B6" />
            </div>
            <span className="text-white font-semibold text-xs">
              {session.isTeamMode ? 'Équipe' : 'Solo'}
            </span>
            <span className="text-white/50 text-xs">Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Manual Questions Card Component
function ManualQuestionsCard({
  totalQuestions,
  sessionId,
  code,
}: {
  totalQuestions: number;
  sessionId: string;
  code: string;
}) {
  const router = useRouter();
  const hasQuestions = totalQuestions > 0;

  return (
    <div className="px-4 pt-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#FFD70040] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3E3666]">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center">
              <div className="w-10 h-10 rounded-xl bg-[#FFD70020] flex items-center justify-center mr-3">
                <PenLine size={20} color="#FFD700" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Questions manuelles</p>
                <p className="text-white/50 text-xs">
                  {hasQuestions ? `${totalQuestions} question(s) enregistrée(s)` : 'Aucune question saisie'}
                </p>
              </div>
            </div>
            {hasQuestions && (
              <div className="bg-[#00D39720] px-3 py-1 rounded-full">
                <span className="text-[#00D397] font-bold text-sm">{totalQuestions}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          {!hasQuestions && (
            <div className="bg-[#D5442F10] rounded-xl p-3 border border-[#D5442F30] flex flex-row items-center mb-3">
              <AlertCircle size={14} color="#D5442F" />
              <span className="text-[#D5442F] text-xs ml-2 flex-1">
                Ajoutez au moins une question avant de démarrer.
              </span>
            </div>
          )}
          <button
            onClick={() => {
              router.push(`/session/${code}/questions?sessionId=${sessionId}`);
            }}
            className="w-full bg-[#FFD70020] border border-[#FFD70040] py-3.5 rounded-2xl flex items-center justify-center hover:bg-[#FFD70030] transition-colors"
          >
            <div className="flex flex-row items-center">
              <PenBox size={18} color="#FFD700" />
              <span className="text-[#FFD700] font-semibold text-sm ml-2">
                {hasQuestions ? 'Modifier les questions' : 'Ajouter des questions'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Teams Card Component
function TeamsCard({
  teams,
  currentPlayerId,
  isManager,
  onChangeTeam,
  onManagerReassign,
}: {
  teams: TeamResponse[];
  currentPlayerId: string | null;
  isManager: boolean;
  onChangeTeam: () => void;
  onManagerReassign: (playerId: string, playerName: string) => void;
}) {
  const currentTeamId = teams.find(t => t.members.some(m => m.id === currentPlayerId))?.id;

  return (
    <div className="px-4 pt-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3E3666]">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center">
              <div className="w-10 h-10 rounded-xl bg-[#4A90D920] flex items-center justify-center mr-3">
                <Trophy size={20} color="#4A90D9" />
              </div>
              <p className="text-white font-bold text-lg">Équipes</p>
            </div>
            {!isManager && (
              <button
                onClick={onChangeTeam}
                className="flex flex-row items-center px-3 py-1.5 rounded-xl bg-[#4A90D920] hover:bg-[#4A90D930] transition-colors"
              >
                <Users size={14} color="#4A90D9" />
                <span className="text-[#4A90D9] text-xs font-semibold ml-1.5">Changer</span>
              </button>
            )}
          </div>
        </div>

        {teams.map((team, index) => (
          <div key={team.id} className={index < teams.length - 1 ? 'border-b border-[#3E3666]' : ''}>
            {/* Team header */}
            <div className="flex flex-row items-center px-5 py-3">
              <div
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: team.color ?? '#3E3666' }}
              />
              <span className="text-white font-semibold flex-1">{team.name}</span>
              <div className="bg-[#3E3666] px-2.5 py-1 rounded-full">
                <span className="text-white/70 text-xs font-medium">
                  {team.members.length} joueur{team.members.length !== 1 ? 's' : ''}
                </span>
              </div>
              {team.score > 0 && (
                <div
                  className="ml-2 px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: (team.color ?? '#3E3666') + '25' }}
                >
                  <span className="text-xs font-bold" style={{ color: team.color ?? '#FFFFFF' }}>
                    {team.score} pts
                  </span>
                </div>
              )}
            </div>

            {/* Team members */}
            {team.members.length > 0 ? (
              team.members.map((member) => {
                const isMe = member.id === currentPlayerId;
                return (
                  <div
                    key={member.id}
                    className={`flex flex-row items-center px-5 py-2 ${isMe ? 'bg-[#00D39708]' : ''}`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-[#3E3666] flex items-center justify-center mr-3">
                      <User size={14} color={isMe ? '#00D397' : '#FFFFFF80'} />
                    </div>
                    <span className={`flex-1 text-sm ${isMe ? 'text-[#00D397] font-semibold' : 'text-white/80'}`}>
                      {member.name}{isMe ? ' (vous)' : ''}
                    </span>
                    {isManager && (
                      <button
                        onClick={() => onManagerReassign(member.id, member.name)}
                        className="w-7 h-7 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
                      >
                        <ChevronRight size={13} color="#FFFFFF60" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-5 pb-3">
                <span className="text-white/30 text-xs italic">Aucun joueur</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Change team hint for current player */}
      {!isManager && currentTeamId && (
        <div className="mt-2 px-1">
          <p className="text-white/30 text-xs text-center">
            Appuyez sur "Changer" pour rejoindre une autre équipe
          </p>
        </div>
      )}
    </div>
  );
}

// Lobby Manager Controls Component
function LobbyManagerControls({
  playerCount,
  minPlayers = 2,
  questionMode = 'AI',
  totalQuestions = 0,
  onStartGame,
  onLeaveSession,
  onDeleteSession,
  isStarting,
  isDeleting = false,
}: {
  playerCount: number;
  minPlayers?: number;
  questionMode?: string;
  totalQuestions?: number;
  onStartGame: () => void;
  onLeaveSession?: () => void;
  onDeleteSession?: () => void;
  isStarting: boolean;
  isDeleting?: boolean;
}) {
  const canStart = playerCount >= minPlayers && (questionMode !== 'MANUAL' || totalQuestions > 0);

  const handleStart = () => {
    if (playerCount < minPlayers) {
      window.alert(`Pas assez de joueurs. Minimum ${minPlayers} joueurs requis pour démarrer (${playerCount} présent)`);
      return;
    }
    if (questionMode === 'MANUAL' && totalQuestions === 0) {
      window.alert("Aucune question. Veuillez d'abord ajouter vos questions avant de démarrer.");
      return;
    }

    const msg = questionMode === 'MANUAL'
      ? `${totalQuestions} question(s) prête(s). Les joueurs ne pourront plus rejoindre. Démarrer la partie ?`
      : 'La génération des questions va commencer. Les joueurs ne pourront plus rejoindre. Démarrer la partie ?';

    if (window.confirm(msg)) {
      onStartGame();
    }
  };

  return (
    <div className="px-4 pt-6">
      <div className="bg-[#342D5B] rounded-3xl border border-[#FFD70040] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3E3666]">
          <div className="flex flex-row items-center">
            <div className="w-10 h-10 rounded-xl bg-[#FFD70020] flex items-center justify-center mr-3">
              <Crown size={20} color="#FFD700" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">Contrôles</p>
              <p className="text-white/50 text-xs">{playerCount} joueur(s)</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={isStarting}
            className={`w-full rounded-2xl py-4 flex flex-row items-center justify-center mb-4 transition-colors ${
              isStarting
                ? 'bg-[#3E3666] cursor-not-allowed'
                : canStart
                ? 'bg-[#00D397] hover:bg-[#00B377]'
                : 'bg-[#3E3666] cursor-not-allowed'
            }`}
          >
            {isStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-white font-bold text-lg">Démarrage...</span>
              </>
            ) : (
              <>
                <Play size={22} color={canStart ? '#292349' : '#FFFFFF40'} fill={canStart ? '#292349' : '#FFFFFF40'} />
                <span className={`font-bold text-lg ml-2 ${canStart ? 'text-[#292349]' : 'text-white/40'}`}>
                  Démarrer la partie
                </span>
              </>
            )}
          </button>

          {!canStart && !isStarting && (
            <div className="flex flex-row items-center justify-center mb-4">
              <AlertCircle size={16} color="#D5442F" />
              <span className="text-[#D5442F] text-sm ml-2">Minimum {minPlayers} joueurs requis</span>
            </div>
          )}

          {/* Secondary Actions */}
          <div className="flex flex-row gap-3">
            <button
              onClick={() => {
                // Share logic — handled via SessionCodeCard
              }}
              className="flex-1 bg-[#3E3666] py-3.5 rounded-xl flex items-center justify-center hover:bg-[#4E4676] transition-colors"
            >
              <div className="flex flex-row items-center">
                <UserPlus size={18} color="#FFFFFF" />
                <span className="text-white font-semibold text-sm ml-2">Inviter</span>
              </div>
            </button>

            {onLeaveSession && (
              <button
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment quitter cette session ?')) {
                    onLeaveSession();
                  }
                }}
                className="flex-1 bg-red-500/20 py-3.5 rounded-xl flex items-center justify-center hover:bg-red-500/30 transition-colors"
              >
                <div className="flex flex-row items-center">
                  <LogOut size={18} color="#EF4444" />
                  <span className="text-red-400 font-semibold text-sm ml-2">Quitter</span>
                </div>
              </button>
            )}
          </div>

          {/* Delete Session Button */}
          {onDeleteSession && (
            <button
              onClick={onDeleteSession}
              disabled={isDeleting}
              className="w-full mt-3 bg-red-600/30 py-3.5 rounded-xl flex items-center justify-center hover:bg-red-600/40 transition-colors border border-red-500/30 disabled:opacity-60"
            >
              {isDeleting ? (
                <div className="flex flex-row items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-red-400 font-semibold text-sm">Suppression...</span>
                </div>
              ) : (
                <div className="flex flex-row items-center">
                  <X size={18} color="#EF4444" />
                  <span className="text-red-400 font-semibold text-sm ml-2">Supprimer la session</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const {
    session,
    players,
    teams,
    fetchSession,
    startSession,
    deleteSession,
    isStarting,
    leaveSession,
  } = useBuzzStore();

  const isManager = session?.managerId === user?.id;
  const currentPlayer = players.find((p) => p.userId === user?.id);

  // Connect WebSocket
  const { isConnected } = useGameSocket(session?.id || null);

  // Initial fetch - load session if not in store or if store has a different session
  useEffect(() => {
    if (!code) return;
    if (session && session.code === code) return;

    if (session && session.code !== code) {
      leaveSession();
    }

    const loadSession = async () => {
      try {
        const activeSession = await appStorage.getActiveSession();
        if (activeSession?.sessionId) {
          await fetchSession(activeSession.sessionId);
          return;
        }
        const checkResult = await useBuzzStore.getState().joinCheck(code);
        if (checkResult?.sessionId) {
          await fetchSession(checkResult.sessionId);
          await appStorage.setActiveSession({
            sessionId: checkResult.sessionId,
            code: checkResult.code,
          });
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
    };

    loadSession();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adaptive polling
  useEffect(() => {
    if (!session?.id) return;

    const ms = isConnected ? 8000 : 2000;
    const interval = setInterval(() => {
      fetchSession(session.id);
    }, ms);

    return () => clearInterval(interval);
  }, [session?.id, fetchSession, isConnected]);

  // Refresh on focus equivalent — poll immediately when remounted
  useEffect(() => {
    if (session?.id) {
      fetchSession(session.id);
    }
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch room info
  useEffect(() => {
    if (!session?.roomId) return;

    const loadRoomInfo = async () => {
      try {
        const data = await roomsApi.getRoomDetail(session.roomId!);
        setRoomInfo(data.room);
      } catch {
        // ignore
      }
    };
    loadRoomInfo();
  }, [session?.roomId]);

  // Navigate based on session status
  useEffect(() => {
    if (session?.status === 'GENERATING') {
      router.replace(`/session/${code}/loading`);
    } else if (session?.status === 'PLAYING') {
      router.replace(`/session/${code}/game`);
    } else if (session?.status === 'RESULTS') {
      router.replace(`/session/${code}/results`);
    }
  }, [session?.status, code]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    const msg = `Rejoins ma partie BuzzMaster! Code: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Invitation BuzzMaster', text: msg });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(msg);
      window.alert('Lien copié dans le presse-papiers !');
    }
  };

  const Q_LIMIT = 60;

  const handleStartGame = async () => {
    if (!session?.id || !code) return;

    // Only check limit in AI mode
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

    try {
      await startSession(session.id);
    } catch (err: any) {
      window.alert(err?.message || 'Impossible de démarrer la partie');
    }
  };

  const handleStartWithAdjustedQ = async () => {
    if (!session?.id) return;
    setIsSavingConfig(true);
    try {
      await sessionsApi.updateSessionConfig(session.id, { questionsPerCategory: adjustedQPerCat });
      await fetchSession(session.id);
    } catch {
      // If update fails, proceed anyway
    } finally {
      setIsSavingConfig(false);
    }
    setShowQLimit(false);
    try {
      await startSession(session.id);
    } catch (err: any) {
      window.alert(err?.message || 'Impossible de démarrer la partie');
    }
  };

  const handleLeave = () => {
    if (window.confirm('Voulez-vous vraiment quitter cette session ?')) {
      const roomId = session?.roomId;
      leaveSession();
      if (roomId) {
        router.replace(`/room/${roomId}`);
      } else {
        router.replace('/');
      }
    }
  };

  const handleDeleteSession = async () => {
    if (!session?.id || isDeletingSession) return;
    if (window.confirm('Supprimer la session ? Cette action est irréversible. Tous les joueurs seront expulsés.')) {
      setIsDeletingSession(true);
      try {
        await deleteSession(session.id);
        router.replace('/');
      } catch (err: any) {
        window.alert(err?.message || 'Impossible de supprimer la session');
        setIsDeletingSession(false);
      }
    }
  };

  const handleKickPlayer = async (playerId: string, playerName: string) => {
    if (!session?.id || kickingPlayerId) return;
    if (window.confirm(`Voulez-vous vraiment retirer ${playerName} de la session ?`)) {
      setKickingPlayerId(playerId);
      try {
        await sessionsApi.removePlayer(session.id, playerId);
      } catch (err: any) {
        window.alert(err?.message || "Impossible d'expulser le joueur");
      } finally {
        setKickingPlayerId(null);
      }
    }
  };

  const handleEditCategories = (player: PlayerResponse) => {
    router.push(`/session/${code}/categories?playerId=${player.id}&playerName=${encodeURIComponent(player.name)}&isEditing=true&sessionId=${session?.id || ''}`);
  };

  const handleEditMyCategories = () => {
    const me = players.find(p => p.userId === user?.id);
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

  if (!session) {
    return (
      <SafeScreen className="bg-[#292349]">
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
              <Sparkles size={40} color="#00D397" />
            </div>
            <p className="text-white font-semibold">Chargement...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666] sticky top-0 z-10">
        <div className="flex flex-row items-center">
          <button
            onClick={() => {
              if (session?.roomId) {
                router.replace(`/room/${session.roomId}`);
              } else {
                router.replace('/');
              }
            }}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">Lobby</p>
            <div className="flex flex-row items-center mt-0.5">
              {isConnected ? (
                <div className="w-2 h-2 rounded-full bg-[#00D397] mr-2" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#D5442F] mr-2" />
              )}
              <span className="text-white/60 text-xs">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
          </div>
          {isManager && (
            <div className="flex flex-row items-center bg-[#FFD70020] px-3 py-1.5 rounded-full">
              <Crown size={14} color="#FFD700" />
              <span className="text-[#FFD700] text-xs font-semibold ml-1.5">Manager</span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center ml-2 hover:bg-[#3E3666] transition-colors"
          >
            <RefreshCw size={16} color={isRefreshing ? '#00D397' : '#FFFFFF'} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto">
        {/* Session Code Card */}
        <SessionCodeCard
          code={code || ''}
          isCopied={isCopied}
          onCopy={handleCopyCode}
          onShare={handleShare}
          onShowQR={() => setShowQRModal(true)}
        />

        {/* Session Info */}
        <SessionInfoCard session={session} />

        {/* Room Info Link */}
        {roomInfo && (
          <div className="px-4 pt-4">
            <div className="bg-[#3E3666] rounded-2xl px-4 py-3 flex flex-row items-center justify-between">
              <div className="flex flex-row items-center">
                <Hash size={14} color="#FFFFFF60" />
                <span className="text-white/70 text-sm ml-2">Salle:</span>
                <span className="text-[#00D397] text-sm font-semibold ml-2">{roomInfo.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Teams Card */}
        {session.isTeamMode && teams.length > 0 && (
          <TeamsCard
            teams={teams}
            currentPlayerId={currentPlayer?.id ?? null}
            isManager={isManager}
            onChangeTeam={handleChangeTeam}
            onManagerReassign={handleManagerReassign}
          />
        )}

        {/* Manual Questions Card */}
        {isManager && session.questionMode === 'MANUAL' && (
          <ManualQuestionsCard
            totalQuestions={session.totalQuestions}
            sessionId={session.id}
            code={code || ''}
          />
        )}

        {/* Manager Controls */}
        {isManager && (
          <LobbyManagerControls
            playerCount={players.length}
            questionMode={session.questionMode}
            totalQuestions={session.totalQuestions}
            onStartGame={handleStartGame}
            onLeaveSession={handleLeave}
            onDeleteSession={handleDeleteSession}
            isStarting={isStarting}
            isDeleting={isDeletingSession}
          />
        )}

        {/* Players List */}
        <div className="px-4 pt-6">
          <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3E3666]">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center">
                  <Users size={20} color="#FFFFFF" />
                  <p className="text-white font-bold text-lg ml-2">Joueurs</p>
                  <div className="bg-[#3E3666] px-3 py-1 rounded-full ml-3">
                    <span className="text-white font-semibold text-sm">
                      {players.length}/{session.maxPlayers}
                    </span>
                  </div>
                </div>

                {!isManager && (
                  <button
                    onClick={handleLeave}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors"
                  >
                    <span className="text-red-400 font-medium text-sm">Quitter</span>
                  </button>
                )}
              </div>
            </div>

            {players.length > 0 ? (
              players.map((player) => (
                <PlayerItem
                  key={player.id}
                  player={player}
                  isManager={player.isManager}
                  isCurrentUser={player.userId === user?.id}
                  isSessionManager={isManager}
                  onKick={isManager ? handleKickPlayer : undefined}
                  onEditCategories={isManager && !player.isManager && session.questionMode !== 'MANUAL' ? handleEditCategories : undefined}
                  onEditSelf={player.userId === user?.id && !player.isSpectator && !player.isManager && session.questionMode !== 'MANUAL' ? handleEditMyCategories : undefined}
                  isKicking={kickingPlayerId === player.id}
                />
              ))
            ) : (
              <div className="px-5 py-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#3E3666] flex items-center justify-center mb-4">
                  <Users size={32} color="#FFFFFF40" />
                </div>
                <p className="text-white/60 text-center font-medium">
                  En attente de joueurs...
                </p>
                <p className="text-white/40 text-sm text-center mt-2">
                  Partagez le code pour inviter
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Waiting Message for Players */}
        {!isManager && players.length > 0 && (
          <div className="px-4 pt-6">
            <div className="bg-[#00D39710] rounded-2xl border border-[#00D39730] p-4">
              <div className="flex flex-row items-center">
                <div className="w-12 h-12 rounded-xl bg-[#00D39720] flex items-center justify-center mr-4">
                  <RefreshCw size={20} color="#00D397" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">En attente du manager</p>
                  <p className="text-white/60 text-sm">
                    {players.find((p) => p.isManager)?.name || 'Le manager'} va démarrer la partie
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>

      {/* Question Limit Warning Modal */}
      {showQLimit && session && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5">
          <div className="w-full max-w-sm bg-[#342D5B] rounded-3xl border border-[#D5442F50] overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#3E3666]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D5442F20] flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={20} color="#D5442F" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Limite dépassée</p>
                  <p className="text-white/50 text-xs">Le total de questions dépasse 60</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              {/* Real count recap */}
              {(() => {
                const realPlayers = players.filter((p) => !p.isSpectator).length;
                const cats = session.maxCategoriesPerPlayer ?? 1;
                const totalCurrent = cats * (session.questionsPerCategory ?? 1) * realPlayers;
                const totalAdjusted = cats * adjustedQPerCat * realPlayers;
                const maxAllowed = Math.max(1, Math.floor(Q_LIMIT / (cats * realPlayers)));
                return (
                  <>
                    {/* Formula — current */}
                    <div className="bg-[#292349] rounded-2xl p-4 mb-4">
                      <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">Situation actuelle</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <div className="flex flex-col items-center bg-[#342D5B] rounded-xl px-3 py-2">
                          <span className="text-[#C084FC] font-bold text-lg">{cats}</span>
                          <span className="text-white/40 text-[10px]">cat/joueur</span>
                        </div>
                        <span className="text-white/30 font-bold">×</span>
                        <div className="flex flex-col items-center bg-[#342D5B] rounded-xl px-3 py-2">
                          <span className="text-[#4A90D9] font-bold text-lg">{session.questionsPerCategory}</span>
                          <span className="text-white/40 text-[10px]">Q/cat</span>
                        </div>
                        <span className="text-white/30 font-bold">×</span>
                        <div className="flex flex-col items-center bg-[#342D5B] rounded-xl px-3 py-2">
                          <span className="text-[#FFD700] font-bold text-lg">{realPlayers}</span>
                          <span className="text-white/40 text-[10px]">joueurs</span>
                        </div>
                        <span className="text-white/30 font-bold">=</span>
                        <div className="flex flex-col items-center bg-[#D5442F20] rounded-xl px-3 py-2">
                          <span className="text-[#D5442F] font-bold text-lg">{totalCurrent}</span>
                          <span className="text-white/40 text-[10px]">/ 60 max</span>
                        </div>
                      </div>
                    </div>

                    {/* Slider adjust */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-medium text-sm">Questions par catégorie</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAdjustedQPerCat((v) => Math.max(1, v - 1))}
                            className="w-7 h-7 rounded-lg bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
                          >
                            <Minus size={14} color="#FFFFFF" />
                          </button>
                          <div className="bg-[#00D39720] px-3 py-1 rounded-lg min-w-[48px] text-center">
                            <span className="text-[#00D397] font-bold text-lg">{adjustedQPerCat}</span>
                          </div>
                          <button
                            onClick={() => setAdjustedQPerCat((v) => Math.min(maxAllowed, v + 1))}
                            className="w-7 h-7 rounded-lg bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
                          >
                            <Plus size={14} color="#FFFFFF" />
                          </button>
                        </div>
                      </div>
                      <Slider
                        label=""
                        value={adjustedQPerCat}
                        onValueChange={setAdjustedQPerCat}
                        min={1}
                        max={maxAllowed}
                        suffix=""
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white/40 text-xs">Total ajusté :</span>
                        <span className={`text-sm font-semibold ${totalAdjusted <= Q_LIMIT ? 'text-[#00D397]' : 'text-[#D5442F]'}`}>
                          {totalAdjusted} questions
                        </span>
                      </div>
                    </div>

                    {/* Info note */}
                    <div className="bg-[#292349] rounded-xl p-3 mb-5 flex items-start gap-2">
                      <AlertCircle size={14} color="#F39C12" className="flex-shrink-0 mt-0.5" />
                      <p className="text-white/50 text-xs leading-relaxed">
                        Maximum recommandé : <span className="text-white font-semibold">{maxAllowed} question{maxAllowed > 1 ? 's' : ''}/catégorie</span> avec {realPlayers} joueur{realPlayers > 1 ? 's' : ''}.
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowQLimit(false)}
                        className="flex-1 py-3.5 rounded-2xl bg-[#3E3666] hover:bg-[#4E4676] transition-colors flex items-center justify-center"
                      >
                        <X size={16} color="#FFFFFF80" />
                        <span className="text-white/60 font-medium ml-2 text-sm">Annuler</span>
                      </button>
                      <button
                        onClick={handleStartWithAdjustedQ}
                        disabled={isSavingConfig || isStarting}
                        className="flex-1 py-3.5 rounded-2xl bg-[#00D397] hover:bg-[#00B377] transition-colors flex items-center justify-center disabled:opacity-60"
                      >
                        {isSavingConfig || isStarting ? (
                          <div className="w-4 h-4 border-2 border-[#292349] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play size={16} color="#292349" fill="#292349" />
                        )}
                        <span className="text-[#292349] font-bold ml-2 text-sm">Démarrer</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        type="session"
        id={session?.id || ''}
        code={code}
        title={`Session de ${session?.managerName || 'Manager'}`}
      />

      {/* Team Picker Overlay */}
      {showTeamPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-[#292349] rounded-t-3xl border-t border-[#3E3666] w-full max-w-lg animate-in slide-in-from-bottom duration-300">
            <div className="px-5 pt-5 pb-3 border-b border-[#3E3666] flex flex-row items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg">Changer d'équipe</p>
                {teamPickerTargetPlayer && (
                  <p className="text-white/50 text-xs mt-0.5">{teamPickerTargetPlayer.name}</p>
                )}
              </div>
              <button
                onClick={() => { setShowTeamPicker(false); setTeamPickerTargetPlayer(null); }}
                className="w-9 h-9 rounded-full bg-[#3E3666] flex items-center justify-center hover:bg-[#4E4676] transition-colors"
              >
                <X size={18} color="#FFFFFF" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 flex flex-col gap-2.5">
              {teams.map((team) => {
                const isCurrentTeam = team.members.some(m => m.id === teamPickerTargetPlayer?.id);
                return (
                  <button
                    key={team.id}
                    onClick={() => teamPickerTargetPlayer && handleAssignTeam(teamPickerTargetPlayer.id, team.id)}
                    disabled={isChangingTeam || isCurrentTeam}
                    className="flex flex-row items-center p-4 rounded-2xl transition-opacity hover:opacity-80 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isCurrentTeam ? (team.color ? `${team.color}20` : '#3E3666') : '#342D5B',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: isCurrentTeam ? (team.color ?? '#3E3666') : '#3E3666',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: team.color ?? '#3E3666' }}
                    />
                    <span className="text-white font-semibold flex-1">{team.name}</span>
                    <span className="text-white/50 text-sm">{team.members.length} joueur{team.members.length !== 1 ? 's' : ''}</span>
                    {isCurrentTeam && (
                      <div className="ml-3 bg-[#00D39720] px-2 py-1 rounded-lg">
                        <span className="text-[#00D397] text-xs font-semibold">Actuel</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {isChangingTeam && (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="h-8" />
          </div>
        </div>
      )}
    </SafeScreen>
  );
}
