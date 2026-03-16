'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Crown, Users, Trophy, Play, Settings, Trash2, X,
  Gamepad2, Eye, Copy, UserPlus, LogOut, Clock, Sparkles,
  ChevronRight, BarChart3, Zap, Target, Star, Hash,
  Swords, Medal, History, Plus, QrCode,
} from 'lucide-react';

import { SessionConfigForm } from '~/components/session/SessionConfigForm';
import { FriendshipButton } from '~/components/ui/FriendshipButton';
import { QRCodeModal } from '~/components/ui/QRCodeModal';
import { useAuthStore } from '~/stores/useAuthStore';
import * as roomsApi from '~/lib/api/rooms';
import * as friendsApi from '~/lib/api/friends';
import * as sessionsApi from '~/lib/api/sessions';
import type { RoomDetailResponse, RoomSessionResponse, SessionStatus } from '~/types/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  LOBBY:      { label: 'Lobby',        color: '#00D397', bg: '#00D39720', icon: Users },
  GENERATING: { label: 'Génération...', color: '#FFD700', bg: '#FFD70020', icon: Zap },
  PLAYING:    { label: 'En cours',     color: '#4A90D9', bg: '#4A90D920', icon: Swords },
  PAUSED:     { label: 'Pause',        color: '#F39C12', bg: '#F39C1220', icon: Clock },
  RESULTS:    { label: 'Terminée',     color: '#C0C0C0', bg: '#C0C0C020', icon: Trophy },
};

// ── Room Code Card ──────────────────────────────────────────────────────────

function RoomCodeCard({
  code,
  onCopy,
  onShowQR,
}: {
  code: string;
  onCopy: () => void;
  onShowQR?: () => void;
}) {
  return (
    <div className="px-4 pt-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] p-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-3">
          <Hash size={16} color="#00D397" />
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider">
            Code de la salle
          </span>
        </div>
        <p className="text-white text-4xl font-bold text-center tracking-[6px] mb-4 select-all">
          {code}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCopy}
            className="flex items-center bg-[#00D39720] px-6 py-3 rounded-2xl hover:bg-[#00D39730] transition-colors"
          >
            <Copy size={18} color="#00D397" />
            <span className="text-[#00D397] font-semibold ml-2">Copier</span>
          </button>
          {onShowQR && (
            <button
              onClick={onShowQR}
              className="flex items-center bg-[#FFD70020] border border-[#FFD70040] px-6 py-3 rounded-2xl hover:bg-[#FFD70030] transition-colors"
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

// ── Active Session Card ──────────────────────────────────────────────────────

function ActiveSessionCard({
  session,
  onPress,
  onDelete,
  isOwner,
}: {
  session: RoomSessionResponse;
  onPress: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}) {
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.LOBBY;
  const StatusIcon = config.icon;

  const getButtonLabel = (status: SessionStatus) => {
    switch (status) {
      case 'LOBBY':   return 'Rejoindre';
      case 'PLAYING': return 'Reprendre';
      case 'PAUSED':  return 'Reprendre';
      case 'RESULTS': return 'Voir résultats';
      default:        return 'Voir';
    }
  };

  return (
    <div className="mb-3">
      <div
        className="bg-[#342D5B] rounded-3xl border overflow-hidden cursor-pointer"
        style={{ borderColor: config.color + '40' }}
        onClick={onPress}
      >
        {/* Gradient header */}
        <div
          className="px-5 py-4"
          style={{ background: `linear-gradient(to bottom, ${config.bg}, transparent)` }}
        >
          <div className="flex p-2 items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-3"
                style={{ backgroundColor: config.bg }}
              >
                <StatusIcon size={24} color={config.color} />
              </div>
              <div>
                <p className="text-white font-bold text-xl tracking-wider">{session.code}</p>
                <p className="text-white/50 text-xs">par {session.managerName}</p>
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: config.bg }}
            >
              <span className="text-xs font-bold" style={{ color: config.color }}>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 flex items-center gap-6">
          <div className="flex items-center">
            <Users size={16} color="#FFFFFF60" />
            <span className="text-white/60 text-sm ml-1.5">
              {session.playerCount}/{session.maxPlayers} joueurs
            </span>
          </div>
          <div className="flex items-center">
            <Target size={16} color="#FFFFFF60" />
            <span className="text-white/60 text-sm ml-1.5">{session.maxPlayers} max</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onPress(); }}
          className="mx-5 mb-3 py-3.5 rounded-2xl flex items-center justify-center w-[calc(100%-40px)]"
          style={{ backgroundColor: config.color }}
        >
          <div className="flex items-center">
            <Play size={18} color="#292349" fill="#292349" />
            <span className="text-[#292349] font-bold text-base ml-2">
              {getButtonLabel(session.status)}
            </span>
          </div>
        </button>

        {isOwner && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="mx-5 mb-4 py-3 rounded-2xl flex items-center justify-center w-[calc(100%-40px)] bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-colors"
          >
            <div className="flex items-center">
              <Trash2 size={18} color="#EF4444" />
              <span className="text-red-400 font-bold text-base ml-2">Supprimer la session</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Member Item ──────────────────────────────────────────────────────────────

function MemberItem({
  member,
  isCurrentUser,
  onAddFriend,
}: {
  member: RoomDetailResponse['members'][0];
  isCurrentUser: boolean;
  onAddFriend: () => void;
}) {
  return (
    <div className="flex items-center py-3 px-4 border-b border-[#3E3666] last:border-b-0">
      <div className="relative mr-3">
        <div className="w-12 h-12 rounded-full bg-[#3E3666] flex items-center justify-center">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt={member.username} />
          ) : (
            <span className="text-white font-bold text-lg">
              {member.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {member.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00D397] border-2 border-[#342D5B]" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center">
          <span className={`font-semibold text-base ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}>
            {member.username}
          </span>
          {member.isOwner && (
            <div className="flex items-center ml-2 px-2 py-0.5 rounded-full bg-[#FFD70020]">
              <Crown size={12} color="#FFD700" />
              <span className="text-[#FFD700] text-xs font-medium ml-1">Chef</span>
            </div>
          )}
        </div>
        <span className="text-white/40 text-xs">
          {member.isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>

      <FriendshipButton
        status={member.friendshipStatus}
        isCurrentUser={isCurrentUser}
        onAddFriend={onAddFriend}
        size="md"
      />
    </div>
  );
}

// ── Ranking Item ─────────────────────────────────────────────────────────────

function RankingItem({
  entry,
  index,
  isCurrentUser,
  onAddFriend,
}: {
  entry: RoomDetailResponse['rankings'][0];
  index: number;
  isCurrentUser: boolean;
  onAddFriend: () => void;
}) {
  const isTop3 = index < 3;

  return (
    <div className="flex items-center py-3 px-4 border-b border-[#3E3666] last:border-b-0">
      <div className="w-10 flex items-center justify-center">
        {index === 0 && <Crown size={20} color="#FFD700" />}
        {index === 1 && <Medal size={20} color="#C0C0C0" />}
        {index === 2 && <Medal size={20} color="#CD7F32" />}
        {index > 2 && (
          <span className="text-white/40 font-bold text-lg">{index + 1}.</span>
        )}
      </div>

      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
          isTop3 ? 'bg-[#FFD70020]' : 'bg-[#3E3666]'
        }`}
      >
        <span className={`font-bold ${isTop3 ? 'text-[#FFD700]' : 'text-white'}`}>
          {entry.username.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1">
        <span className={`font-medium text-base ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}>
          {entry.username}
          {isCurrentUser && <span className="text-[#00D397] text-xs"> (Vous)</span>}
        </span>
      </div>

      <div className="items-end text-right mr-3">
        <p className={`font-bold text-base ${isTop3 ? 'text-[#FFD700]' : 'text-white'}`}>
          {entry.totalScore} pts
        </p>
        <p className="text-white/40 text-xs">
          {entry.gamesPlayed} parties • {entry.gamesWon} 🏆
        </p>
      </div>

      <FriendshipButton
        status={entry.friendshipStatus}
        isCurrentUser={isCurrentUser}
        onAddFriend={onAddFriend}
        size="sm"
      />
    </div>
  );
}

// ── History Session Item ──────────────────────────────────────────────────────

function HistorySessionItem({
  session,
  onPress,
}: {
  session: RoomSessionResponse;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className="flex items-center py-3 px-4 border-b border-[#3E3666] last:border-b-0 hover:bg-white/5 w-full text-left transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-[#C0C0C020] flex items-center justify-center mr-3">
        <History size={20} color="#C0C0C0" />
      </div>
      <div className="flex-1">
        <p className="text-white font-medium text-base">{session.code}</p>
        <p className="text-white/40 text-xs">
          {session.managerName} • {session.playerCount} joueurs
        </p>
      </div>
      <ChevronRight size={20} color="#FFFFFF40" />
    </button>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function RoomDetailPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();

  const [roomData, setRoomData] = useState<RoomDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const user = useAuthStore((state) => state.user);
  const room = roomData?.room;
  const isOwner = room?.ownerId === user?.id;
  const members = roomData?.members ?? [];
  const sessions = roomData?.sessions ?? [];
  const rankings = roomData?.rankings ?? [];

  const activeSessions = sessions.filter(
    (s) => s.status === 'LOBBY' || s.status === 'GENERATING' || s.status === 'PLAYING' || s.status === 'PAUSED'
  );
  const pastSessions = sessions.filter((s) => s.status === 'RESULTS');
  const hasActiveSession = activeSessions.length > 0;

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await roomsApi.getRoomDetail(roomId);
      setRoomData(data);
    } catch (err) {
      console.error('Failed to load room:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRoom();
    setIsRefreshing(false);
  };

  const navigateToSession = (session: RoomSessionResponse) => {
    const { code, status, id: sessionId } = session;

    if (status === 'LOBBY') {
      router.push(`/session/${code}/categories?sessionId=${sessionId}`);
    } else {
      const routes: Record<string, string> = {
        GENERATING: `/session/${code}/loading`,
        PLAYING:    `/session/${code}/game`,
        RESULTS:    `/session/${code}/results`,
        PAUSED:     `/session/${code}/game`,
      };
      router.push(`${routes[status] || `/session/${code}/lobby`}?sessionId=${sessionId}&roomId=${roomId}`);
    }
  };

  const handleCreateSession = () => {
    setShowConfigModal(true);
  };

  const handleSessionCreated = (_sessionId: string, code: string) => {
    setShowConfigModal(false);
    router.push(`/session/${code}/lobby`);
  };

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code);
    window.alert(`Le code ${room.code} a été copié.`);
  };

  const handleSendFriendRequest = async (targetUserId: string, _username: string) => {
    if (targetUserId === user?.id) return;
    try {
      await friendsApi.sendFriendRequest(targetUserId);
      await loadRoom();
    } catch (err: any) {
      // silently ignore 409 conflicts
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    const confirmed = window.confirm(`Vous ne verrez plus "${room.name}" dans vos salles. Quitter ?`);
    if (!confirmed) return;
    try {
      await roomsApi.leaveRoom(room.code);
      router.replace('/rooms');
    } catch (err) {
      window.alert('Impossible de quitter la salle');
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionCode: string) => {
    const confirmed = window.confirm(`La session ${sessionCode} sera définitivement supprimée. Continuer ?`);
    if (!confirmed) return;
    try {
      await sessionsApi.deleteSession(sessionId);
      await loadRoom();
    } catch (err) {
      window.alert('Impossible de supprimer la session');
    }
  };

  const handleDeleteRoom = async () => {
    const confirmed = window.confirm('Cette action est irréversible. Toutes les statistiques seront perdues. Supprimer la salle ?');
    if (!confirmed) return;
    try {
      await roomsApi.deleteRoom(roomId);
      router.replace('/rooms');
    } catch (err) {
      window.alert('Impossible de supprimer la salle');
    }
  };

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
            <Sparkles size={40} color="#00D397" />
          </div>
          <p className="text-white font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#292349] flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#342D5B] flex items-center justify-center mb-4">
            <Eye size={48} color="#6B7280" />
          </div>
          <p className="text-white/60 text-center mb-4">Salle introuvable</p>
          <button
            onClick={() => router.back()}
            className="bg-[#00D397] px-8 py-4 rounded-2xl hover:bg-[#00B377] transition-colors"
          >
            <span className="text-[#292349] font-bold">Retour</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666]">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-xl truncate">{room.name}</p>
            <p className="text-white/50 text-xs">
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isOwner && (
            <div className="flex items-center bg-[#FFD70020] px-3 py-1.5 rounded-full">
              <Crown size={14} color="#FFD700" />
              <span className="text-[#FFD700] text-xs font-semibold ml-1.5">Chef</span>
            </div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end px-4 pt-3">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-[#00D397] text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div className="overflow-y-auto">
        {/* Room Code */}
        <RoomCodeCard
          code={room.code}
          onCopy={handleCopyCode}
          onShowQR={() => setShowQRModal(true)}
        />

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="px-4 pt-6">
            <div className="flex items-center mb-3 px-1">
              <Zap size={18} color="#00D397" />
              <p className="text-white font-bold text-lg ml-2">Sessions actives</p>
            </div>
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                onPress={() => navigateToSession(session)}
                onDelete={() => handleDeleteSession(session.id, session.code)}
                isOwner={isOwner}
              />
            ))}
          </div>
        )}

        {/* Create Session (owner only) */}
        {isOwner && (
          <div className="px-4 pt-6">
            <button
              onClick={handleCreateSession}
              disabled={hasActiveSession}
              className={`w-full py-4 rounded-2xl flex items-center justify-center transition-colors ${
                hasActiveSession
                  ? 'bg-[#3E3666] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00D397] to-[#00B383] hover:opacity-90'
              }`}
            >
              {hasActiveSession ? (
                <>
                  <Clock size={22} color="#FFFFFF60" />
                  <span className="text-white/60 font-bold text-lg ml-2">Session déjà active</span>
                </>
              ) : (
                <>
                  <Plus size={24} color="#292349" strokeWidth={3} />
                  <span className="text-[#292349] font-bold text-lg ml-2">Nouvelle session</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && !isOwner && (
          <div className="px-4 pt-6">
            <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] p-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#3E3666] flex items-center justify-center mb-4">
                <Eye size={32} color="#FFFFFF40" />
              </div>
              <p className="text-white/60 text-center font-medium">Aucune session en cours</p>
              <p className="text-white/40 text-sm text-center mt-2">
                Le chef de la salle peut démarrer une partie
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {room.description && (
          <div className="px-4 pt-6">
            <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] p-5">
              <p className="text-white/80 text-sm leading-relaxed">{room.description}</p>
            </div>
          </div>
        )}

        {/* Members */}
        <div className="px-4 pt-6">
          <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3E3666]">
              <div className="flex items-center">
                <Users size={20} color="#FFFFFF" />
                <p className="text-white font-bold text-lg ml-2">Membres</p>
                <p className="text-white/40 text-sm ml-2">({members.length})</p>
              </div>
            </div>
            {members.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                isCurrentUser={member.userId === user?.id}
                onAddFriend={() => handleSendFriendRequest(member.userId, member.username)}
              />
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div className="px-4 pt-6">
          <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3E3666]">
              <div className="flex items-center">
                <BarChart3 size={20} color="#FFD700" />
                <p className="text-white font-bold text-lg ml-2">Classement</p>
              </div>
            </div>
            {rankings.length === 0 ? (
              <div className="px-5 py-8 flex flex-col items-center">
                <Trophy size={32} color="#FFFFFF30" />
                <p className="text-white/50 text-center mt-3">
                  Aucune partie jouée dans cette salle
                </p>
              </div>
            ) : (
              rankings.map((entry, index) => (
                <RankingItem
                  key={entry.userId}
                  entry={entry}
                  index={index}
                  isCurrentUser={entry.userId === user?.id}
                  onAddFriend={() => handleSendFriendRequest(entry.userId, entry.username)}
                />
              ))
            )}
          </div>
        </div>

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div className="px-4 pt-6">
            <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#3E3666]">
                <div className="flex items-center">
                  <History size={20} color="#C0C0C0" />
                  <p className="text-white font-bold text-lg ml-2">Historique</p>
                </div>
              </div>
              {pastSessions.map((session) => (
                <HistorySessionItem
                  key={session.id}
                  session={session}
                  onPress={() => navigateToSession(session)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pt-6 pb-10">
          <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3E3666]">
              <p className="text-white font-bold">Actions</p>
            </div>
            {isOwner && (
              <>
                <button
                  onClick={() => router.push(`/room/${roomId}/edit`)}
                  className="flex items-center px-5 py-4 border-b border-[#3E3666] hover:bg-white/5 w-full text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center mr-3">
                    <Settings size={20} color="#FFFFFF" />
                  </div>
                  <span className="text-white flex-1 font-medium">Modifier la salle</span>
                  <ChevronRight size={20} color="#FFFFFF40" />
                </button>
                <button
                  onClick={handleDeleteRoom}
                  className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mr-3">
                    <Trash2 size={20} color="#EF4444" />
                  </div>
                  <span className="text-red-400 flex-1 font-medium">Supprimer la salle</span>
                  <ChevronRight size={20} color="#EF4444" />
                </button>
              </>
            )}
            {!isOwner && (
              <button
                onClick={handleLeaveRoom}
                className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mr-3">
                  <LogOut size={20} color="#EF4444" />
                </div>
                <span className="text-red-400 flex-1 font-medium">Quitter la salle</span>
                <ChevronRight size={20} color="#EF4444" />
              </button>
            )}
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        type="room"
        id={room?.id || ''}
        code={room?.code}
        title={room?.name || 'Salle'}
      />

      {/* Session Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div
            className="absolute inset-0"
            onClick={() => setShowConfigModal(false)}
          />
          <div className="relative bg-[#292349] rounded-t-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-[#3E3666]">
              <div>
                <p className="text-white font-bold text-xl">Nouvelle Session</p>
                <p className="text-white/60 text-xs mt-0.5">Configure ta partie</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center hover:bg-[#3E3666] transition-colors"
              >
                <X size={20} color="#FFFFFF" />
              </button>
            </div>
            <SessionConfigForm roomId={roomId} onSuccess={handleSessionCreated} />
          </div>
        </div>
      )}
    </div>
  );
}
