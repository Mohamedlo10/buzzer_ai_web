'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Crown, Users, Trophy, Play, Settings, Trash2, X,
  Gamepad2, Eye, Copy, UserPlus, LogOut, Clock, Sparkles,
  ChevronRight, Zap, Target, Hash,
  Swords, Medal, History, Plus, QrCode, Home, LayoutGrid,
} from 'lucide-react';

import { SessionConfigForm } from '~/components/session/SessionConfigForm';
import { FriendshipButton } from '~/components/ui/FriendshipButton';
import { useAuthStore } from '~/stores/useAuthStore';
import { useRoomSocket } from '~/lib/websocket';
import * as qrcodeApi from '~/lib/api/qrcode';
import * as roomsApi from '~/lib/api/rooms';
import * as friendsApi from '~/lib/api/friends';
import * as sessionsApi from '~/lib/api/sessions';
import type { FriendResponse, RoomDetailResponse, RoomSessionResponse, SessionStatus } from '~/types/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  LOBBY:      { label: 'Lobby',        color: '#00D397', bg: '#00D39720', icon: Users },
  GENERATING: { label: 'Génération...', color: '#FFD700', bg: '#FFD70020', icon: Zap },
  PLAYING:    { label: 'En cours',     color: '#4A90D9', bg: '#4A90D920', icon: Swords },
  PAUSED:     { label: 'Pause',        color: '#F39C12', bg: '#F39C1220', icon: Clock },
  RESULTS:    { label: 'Terminée',     color: '#C0C0C0', bg: '#C0C0C020', icon: Trophy },
};

// ── Room Code Card (with inline QR) ─────────────────────────────────────────

function RoomCodeCard({
  code,
  qrImage,
  qrLoading,
  onCopy,
  onShare,
}: {
  code: string;
  qrImage: string | null;
  qrLoading: boolean;
  onCopy: () => void;
  onShare: () => void;
}) {
  return (
    <div className="px-4 pt-4">
      <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] p-6 flex flex-col items-center">
        {/* QR Code */}
        <div className="mb-5">
          {qrLoading ? (
            <div className="w-52 h-52 rounded-2xl bg-[#292349] flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/40 text-xs mt-3">Chargement...</p>
            </div>
          ) : qrImage ? (
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImage} alt="QR Code" className="w-52 h-52 object-contain" />
            </div>
          ) : (
            <div className="w-52 h-52 rounded-2xl bg-[#292349] flex flex-col items-center justify-center border border-dashed border-[#3E3666]">
              <QrCode size={40} color="#FFFFFF20" />
              <p className="text-white/30 text-xs mt-2">Indisponible</p>
            </div>
          )}
        </div>

        {/* Code below QR */}
        <div className="flex items-center gap-2 mb-1">
          <Hash size={14} color="#00D397" />
          <span className="text-white/50 text-xs font-medium uppercase tracking-wider">
            Code de la salle
          </span>
        </div>
        <p className="text-white text-4xl font-bold text-center tracking-[6px] mb-1 select-all">
          {code}
        </p>
        <p className="text-white/30 text-xs mb-5">Scannez ou partagez le code</p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCopy}
            className="flex-1 flex items-center justify-center bg-[#00D39720] px-4 py-3 rounded-2xl hover:bg-[#00D39730] transition-colors"
          >
            <Copy size={17} color="#00D397" />
            <span className="text-[#00D397] font-semibold ml-2">Copier</span>
          </button>
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center bg-[#3E3666] px-4 py-3 rounded-2xl hover:bg-[#4E4676] transition-colors"
          >
            <UserPlus size={17} color="#FFFFFF" />
            <span className="text-white font-semibold ml-2">Partager</span>
          </button>
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

// ── Members + Rankings merged ─────────────────────────────────────────────────

function MembersWithStats({
  members,
  rankings,
  currentUserId,
  onAddFriend,
}: {
  members: RoomDetailResponse['members'];
  rankings: RoomDetailResponse['rankings'];
  currentUserId: string;
  onAddFriend: (userId: string, username: string) => void;
}) {
  // Merge: for each member find their ranking stats, sort by ratio pts/partie desc
  const merged = members
    .map((m) => {
      const rank = rankings.find((r) => r.userId === m.userId);
      const ratio = rank && rank.gamesPlayed > 0
        ? rank.totalScore / rank.gamesPlayed
        : 0;
      return { member: m, rank, ratio };
    })
    .sort((a, b) => b.ratio - a.ratio);

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3E3666]">
        <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Membres</p>
        <div className="bg-[#00D39720] px-3 py-1 rounded-full">
          <span className="text-[#00D397] text-xs font-bold">{members.length} Joueur{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {merged.map(({ member, rank, ratio }, index) => {
        const isCurrentUser = member.userId === currentUserId;
        const color = rankColors[index] ?? '#FFFFFF60';
        const hasPlayed = (rank?.gamesPlayed ?? 0) > 0;

        return (
          <div
            key={member.id}
            className={`flex items-center py-3 px-4 border-b border-[#3E3666] last:border-b-0 ${isCurrentUser ? 'bg-[#00D39708]' : ''}`}
          >
            {/* Rank badge */}
            <div className="w-8 flex items-center justify-center mr-2 shrink-0">
              {index === 0 && hasPlayed && <Crown size={16} color="#FFD700" />}
              {index === 1 && hasPlayed && <Medal size={16} color="#C0C0C0" />}
              {index === 2 && hasPlayed && <Medal size={16} color="#CD7F32" />}
              {(!hasPlayed || index > 2) && (
                <span className="text-white/30 text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="relative mr-3 shrink-0">
              <div className="w-11 h-11 rounded-full bg-[#3E3666] flex items-center justify-center overflow-hidden">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.avatarUrl} className="w-11 h-11 rounded-full object-cover" alt={member.username} />
                ) : (
                  <span className="text-white font-bold">{member.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#342D5B] ${member.isOnline ? 'bg-[#00D397]' : 'bg-[#6B7280]'}`} />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-semibold text-sm ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}>
                  {member.username}
                </span>
                {member.isOwner && (
                  <div className="flex items-center px-1.5 py-0.5 rounded-full bg-[#FFD70020]">
                    <Crown size={10} color="#FFD700" />
                    <span className="text-[#FFD700] text-[10px] font-medium ml-0.5">Chef</span>
                  </div>
                )}
              </div>
              <span className="text-white/30 text-xs">
                {member.isOnline ? 'En ligne' : 'Hors ligne'}
                {hasPlayed ? ` • ${rank!.gamesPlayed} partie${rank!.gamesPlayed > 1 ? 's' : ''}` : ''}
              </span>
            </div>

            {/* Stats */}
            {hasPlayed && (
              <div className="text-right mr-3 shrink-0">
                <p className="font-bold text-sm" style={{ color }}>{Math.round(ratio)} <span className="text-white/30 text-[10px] font-normal">moy</span></p>
                <p className="text-white/30 text-[10px]">{rank!.gamesWon} 🏆</p>
              </div>
            )}

            <FriendshipButton
              status={member.friendshipStatus}
              isCurrentUser={isCurrentUser}
              onAddFriend={() => onAddFriend(member.userId, member.username)}
              size="sm"
            />
          </div>
        );
      })}
    </div>
  );
}

// ── History Modal ─────────────────────────────────────────────────────────────

function HistoryModal({
  sessions,
  onNavigate,
  onClose,
}: {
  sessions: RoomSessionResponse[];
  onNavigate: (session: RoomSessionResponse) => void;
  onClose: () => void;
}) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return `Aujourd'hui • ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (diff === 1) return `Hier • ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#292349] pb-20 rounded-t-3xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-[#3E3666] shrink-0">
          <div>
            <p className="text-white font-bold text-xl">Historique des parties</p>
            <p className="text-white/50 text-xs mt-0.5">{sessions.length} partie{sessions.length !== 1 ? 's' : ''} jouée{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center">
            <X size={20} color="#FFFFFF" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <History size={40} color="#FFFFFF20" />
              <p className="text-white/40 text-center mt-3">Aucune partie terminée</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => { onNavigate(session); onClose(); }}
                className="flex items-center px-4 py-4 border-b border-[#3E3666] last:border-b-0 hover:bg-white/5 w-full text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C0C0C020] flex items-center justify-center mr-3 shrink-0">
                  <Trophy size={18} color="#C0C0C0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">Partie #{session.code}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {formatDate(session.createdAt)} • {session.playerCount} joueurs
                  </p>
                </div>
                <ChevronRight size={18} color="#FFFFFF30" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Invite Friends Modal ─────────────────────────────────────────────────────

function InviteFriendsModal({
  roomId,
  memberUserIds,
  pendingInvitationUserIds,
  onClose,
}: {
  roomId: string;
  memberUserIds: string[];
  pendingInvitationUserIds: string[];
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    friendsApi.getFriends().then((list) => {
      // Exclure les membres déjà dans la salle
      setFriends(list.filter((f) => !memberUserIds.includes(f.id)));
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const isAlreadyInvited = (id: string) => pendingInvitationUserIds.includes(id);

  const toggle = (id: string) => {
    if (isAlreadyInvited(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setIsSending(true);
    try {
      await roomsApi.inviteToRoom(roomId, Array.from(selected));
      setSent(true);
      setTimeout(onClose, 1200);
    } catch {
      window.alert("Impossible d'envoyer les invitations");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60  flex items-end justify-center z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#292349] pb-20 rounded-t-3xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-[#3E3666] shrink-0">
          <div>
            <p className="text-white font-bold text-xl">Inviter des amis</p>
            <p className="text-white/50 text-xs mt-0.5">
              {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}` : 'Sélectionne des amis'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center hover:bg-[#3E3666] transition-colors cursor-pointer"
          >
            <X size={20} color="#FFFFFF" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-6">
              <UserPlus size={40} color="#FFFFFF30" />
              <p className="text-white/50 text-center mt-3">
                Aucun ami disponible à inviter
              </p>
              <p className="text-white/30 text-sm text-center mt-1">
                Tous vos amis sont déjà membres de cette salle
              </p>
            </div>
          ) : (
            friends.map((friend) => {
              const isSelected = selected.has(friend.id);
              const alreadyInvited = isAlreadyInvited(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => toggle(friend.id)}
                  disabled={alreadyInvited}
                  className={`flex items-center px-4 py-3 w-full transition-colors ${
                    alreadyInvited ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 mr-3">
                    <div className="w-12 h-12 rounded-full bg-[#3E3666] flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#292349] ${
                        friend.isOnline ? 'bg-[#00D397]' : 'bg-[#6B7280]'
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{friend.username}</p>
                    <p className="text-white/40 text-xs">
                      {alreadyInvited
                        ? 'Invitation déjà envoyée'
                        : `${friend.isOnline ? 'En ligne' : 'Hors ligne'}${friend.globalRank != null ? ` · #${friend.globalRank}` : ''}`
                      }
                    </p>
                  </div>

                  {/* Checkbox ou badge */}
                  {alreadyInvited ? (
                    <div className="px-2 py-1 rounded-lg bg-[#3E3666]">
                      <span className="text-white/40 text-xs">En attente</span>
                    </div>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#00D397] border-[#00D397]'
                          : 'border-[#3E3666] bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                          <path d="M1 4L4.5 7.5L11 1" stroke="#292349" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Send button */}
        {friends.length > 0 && (
          <div className="px-4 py-4 border-t border-[#3E3666] shrink-0">
            <button
              onClick={handleSend}
              disabled={selected.size === 0 || isSending || sent}
              className={`w-full py-4 rounded-2xl flex items-center justify-center transition-colors font-bold text-base ${
                sent
                  ? 'bg-[#00D39740] cursor-default'
                  : selected.size === 0 || isSending
                  ? 'bg-[#3E3666] cursor-not-allowed'
                  : 'bg-[#00D397] hover:opacity-90 cursor-pointer'
              }`}
            >
              {sent ? (
                <span className="text-[#00D397]">Invitations envoyées ✓</span>
              ) : isSending ? (
                <span className="text-white/60">Envoi en cours...</span>
              ) : (
                <span className={selected.size > 0 ? 'text-[#292349]' : 'text-white/40'}>
                  {selected.size > 0
                    ? `Inviter ${selected.size} ami${selected.size > 1 ? 's' : ''}`
                    : 'Sélectionne des amis'}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  // Real-time presence overrides: userId → isOnline
  const [memberPresence, setMemberPresence] = useState<Record<string, boolean>>({});

  const user = useAuthStore((state) => state.user);
  const room = roomData?.room;
  const isOwner = room?.ownerId === user?.id;

  // Merge server-loaded members with real-time presence overrides
  const members = (roomData?.members ?? []).map((m) =>
    m.userId in memberPresence ? { ...m, isOnline: memberPresence[m.userId] } : m
  );
  const sessions = roomData?.sessions ?? [];
  const rankings = roomData?.rankings ?? [];

  const activeSessions = sessions.filter(
    (s) => s.status === 'LOBBY' || s.status === 'GENERATING' || s.status === 'PLAYING' || s.status === 'PAUSED'
  );
  const pastSessions = sessions.filter((s) => s.status === 'RESULTS' || s.status === 'CANCELLED');
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

  const loadQR = useCallback(async (roomId: string) => {
    setQrLoading(true);
    try {
      const blob = await qrcodeApi.getRoomQR(roomId);
      const reader = new FileReader();
      reader.onloadend = () => setQrImage(reader.result as string);
      reader.readAsDataURL(blob);
    } catch {
      // silently fail — inline fallback shown
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Refresh silencieux toutes les 30s (presence is now handled via WebSocket)
  useEffect(() => {
    const interval = setInterval(loadRoom, 30_000);
    return () => clearInterval(interval);
  }, [loadRoom]);

  // WebSocket: real-time presence for this room
  useRoomSocket(roomId ?? null, {
    onPresence: (event) => {
      setMemberPresence((prev) => ({ ...prev, [event.userId]: event.isOnline }));
    },
    onDisconnect: () => {
      // Mark current user offline locally immediately on transport close
      if (user?.id) {
        setMemberPresence((prev) => ({ ...prev, [user.id]: false }));
      }
    },
  });

  useEffect(() => {
    if (roomData?.room?.id) loadQR(roomData.room.id);
  }, [roomData?.room?.id, loadQR]);

  useEffect(() => {
    document.body.style.overflow = showConfigModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showConfigModal]);

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
    try { await navigator.clipboard.writeText(room.code); } catch { /* fallback */ }
    window.alert(`Le code ${room.code} a été copié.`);
  };

  const handleShare = async () => {
    if (!room) return;
    const msg = `Rejoins ma salle Quiz By Mouha_Dev! Code: ${room.code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Invitation Quiz By Mouha_Dev', text: msg }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(msg);
    }
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
    <div className="min-h-screen bg-[#292349] flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center px-4 pt-6 pb-4 gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center shrink-0"
        >
          <ChevronRight size={20} color="#00D397" className="rotate-180" />
        </button>
        <p className="text-white font-bold text-xl flex-1">Room #{room.name}</p>
        {isOwner && (
          <button
            onClick={() => router.push(`/room/${roomId}/edit`)}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center"
          >
            <Settings size={20} color="#FFFFFF80" />
          </button>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className={`flex-1 overflow-y-auto pb-[140px] px-4 flex flex-col gap-4${showConfigModal ? ' overflow-hidden' : ''}`}>

        {/* QR + Code */}
        <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] p-5 flex flex-col items-center">
          {qrLoading ? (
            <div className="w-36 h-36 rounded-2xl bg-[#292349] flex items-center justify-center mb-4">
              <div className="w-6 h-6 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrImage ? (
            <div className="bg-white p-2.5 rounded-2xl shadow-lg mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImage} alt="QR Code" className="w-36 h-36 object-contain" />
            </div>
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-[#292349] flex flex-col items-center justify-center border border-dashed border-[#3E3666] mb-4">
              <QrCode size={32} color="#FFFFFF20" />
            </div>
          )}
          <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Code de la salle</p>
          <p className="text-[#00D397] text-3xl font-bold tracking-[6px] select-all">{room.code}</p>
        </div>

        {/* Invite button */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full py-4 rounded-2xl flex items-center justify-center bg-[#00D397] hover:opacity-90 transition-opacity"
        >
          <UserPlus size={20} color="#292349" />
          <span className="text-[#292349] font-bold text-base ml-2">Inviter des amis</span>
        </button>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div>
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-2">Session active</p>
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

        {/* Members + Rankings fusionnés */}
        <MembersWithStats
          members={members}
          rankings={rankings}
          currentUserId={user?.id ?? ''}
          onAddFriend={handleSendFriendRequest}
        />

        {/* Danger zone */}
        <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
          {!isOwner ? (
            <button
              onClick={handleLeaveRoom}
              className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors"
            >
              <LogOut size={18} color="#EF4444" className="mr-3" />
              <span className="text-red-400 font-medium">Quitter la salle</span>
            </button>
          ) : (
            <button
              onClick={handleDeleteRoom}
              className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors"
            >
              <Trash2 size={18} color="#EF4444" className="mr-3" />
              <span className="text-red-400 font-medium">Supprimer la salle</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom action bar (above tab nav) ── */}
      <div className="fixed bottom-[70px] left-0 right-0 bg-[#292349] border-t border-[#3E3666] px-4 py-3 flex items-center justify-between gap-3 z-40">
        {/* Invite */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex flex-col items-center gap-1 flex-1"
        >
          <UserPlus size={22} color="#FFFFFF80" />
          <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Invite</span>
        </button>

        {/* Start Game — center pill */}
        <button
          onClick={hasActiveSession ? () => navigateToSession(activeSessions[0]) : handleCreateSession}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full"
          style={{ background: 'linear-gradient(135deg, #00D397, #00B383)' }}
        >
          <Play size={18} color="#292349" fill="#292349" />
          <span className="text-[#292349] font-bold text-sm tracking-wider uppercase">
            {hasActiveSession ? 'Rejoindre' : 'Start Game'}
          </span>
        </button>

        {/* Historique */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex flex-col items-center gap-1 flex-1"
        >
          <History size={22} color="#FFFFFF80" />
          <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Historique</span>
        </button>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <HistoryModal
          sessions={pastSessions}
          onNavigate={navigateToSession}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal
          roomId={roomId}
          memberUserIds={members.map((m) => m.userId)}
          pendingInvitationUserIds={roomData?.pendingInvitationUserIds ?? []}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Session Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" style={{ touchAction: 'none' }}>
          <div
            className="absolute inset-0"
            onClick={() => setShowConfigModal(false)}
          />
          <div className="relative bg-[#292349] rounded-t-3xl w-full max-w-2xl h-full overflow-y-auto overscroll-y-contain" onTouchMove={(e) => e.stopPropagation()}>
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
