'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { UserProfileModal } from '~/components/shared/UserProfileModal';
import { Avatar } from '~/components/shared/Avatar';
import type { FriendResponse, RoomDetailResponse, RoomSessionResponse, SessionStatus } from '~/types/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  LOBBY: { label: 'Lobby', color: 'var(--primary)', bg: 'rgb(var(--primary-rgb) / 0.125)', icon: Users },
  GENERATING: { label: 'Génération...', color: 'var(--gold)', bg: 'rgb(var(--gold-rgb) / 0.125)', icon: Zap },
  PLAYING: { label: 'En cours', color: 'var(--indigo)', bg: 'rgb(var(--indigo-rgb) / 0.125)', icon: Swords },
  PAUSED: { label: 'Pause', color: 'var(--warn)', bg: 'rgb(var(--warn-rgb) / 0.125)', icon: Clock },
  RESULTS: { label: 'Terminée', color: '#C0C0C0', bg: '#C0C0C020', icon: Trophy },
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
      <div className="bg-surface rounded-3xl border border-line p-6 flex flex-col items-center">
        {/* QR Code */}
        <div className="mb-5">
          {qrLoading ? (
            <div className="w-52 h-52 rounded-2xl bg-bg flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-txt-40 text-xs mt-3">Chargement...</p>
            </div>
          ) : qrImage ? (
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImage} alt="QR Code" className="w-52 h-52 object-contain" />
            </div>
          ) : (
            <div className="w-52 h-52 rounded-2xl bg-bg flex flex-col items-center justify-center border border-dashed border-line">
              <QrCode size={40} color="#FFFFFF20" />
              <p className="text-txt-40 text-xs mt-2">Indisponible</p>
            </div>
          )}
        </div>

        {/* Code below QR */}
        <div className="flex items-center gap-2 mb-1">
          <Hash size={14} color="var(--primary)" />
          <span className="text-txt-60 text-xs font-medium uppercase tracking-wider">
            Code de la salle
          </span>
        </div>
        <p className="text-txt text-4xl font-bold text-center tracking-[6px] mb-1 select-all">
          {code}
        </p>
        <p className="text-txt-40 text-xs mb-5">Scannez ou partagez le code</p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCopy}
            className="flex-1 flex items-center justify-center bg-accent/15 px-4 py-3 rounded-2xl hover:bg-accent/20 transition-colors"
          >
            <Copy size={17} color="var(--primary)" />
            <span className="text-accent font-semibold ml-2">Copier</span>
          </button>
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center bg-surface-2 px-4 py-3 rounded-2xl hover:bg-surface-2 transition-colors"
          >
            <UserPlus size={17} color="#FFFFFF" />
            <span className="text-txt font-semibold ml-2">Partager</span>
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
  canDelete,
}: {
  session: RoomSessionResponse;
  onPress: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.LOBBY;
  const StatusIcon = config.icon;

  const getButtonLabel = (status: SessionStatus) => {
    switch (status) {
      case 'LOBBY': return 'Rejoindre';
      case 'PLAYING': return 'Reprendre';
      case 'PAUSED': return 'Reprendre';
      case 'RESULTS': return 'Voir résultats';
      default: return 'Voir';
    }
  };

  return (
    <div className="mb-3">
      <div
        className="bg-surface rounded-3xl border overflow-hidden cursor-pointer"
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
                <p className="text-txt font-bold text-xl tracking-wider">{session.code}</p>
                <p className="text-txt-60 text-xs">par {session.managerName}</p>
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
            <span className="text-txt-60 text-sm ml-1.5">
              {session.playerCount}/{session.maxPlayers} joueurs
            </span>
          </div>
          <div className="flex items-center">
            <Target size={16} color="#FFFFFF60" />
            <span className="text-txt-60 text-sm ml-1.5">{session.maxPlayers} max</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onPress(); }}
          className="mx-5 mb-3 py-3.5 rounded-2xl flex items-center justify-center w-[calc(100%-40px)]"
          style={{ backgroundColor: config.color }}
        >
          <div className="flex items-center">
            <Play size={18} className="text-btn-fg" fill="currentColor" />
            <span className="text-btn-fg font-bold text-base ml-2">
              {getButtonLabel(session.status)}
            </span>
          </div>
        </button>

        {canDelete && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="mx-5 mb-4 py-3 rounded-2xl flex items-center justify-center w-[calc(100%-40px)] bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-colors"
          >
            <div className="flex items-center">
              <Trash2 size={18} color="var(--bad)" />
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
  onSelectUser,
}: {
  members: RoomDetailResponse['members'];
  rankings: RoomDetailResponse['rankings'];
  currentUserId: string;
  onAddFriend: (userId: string, username: string) => void;
  onSelectUser?: (member: RoomDetailResponse['members'][number]) => void;
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

  const rankColors = ['var(--gold)', '#C0C0C0', '#CD7F32'];

  return (
    <div className="bg-surface rounded-3xl border border-line">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase">Membres</p>
        <div className="bg-accent/15 px-3 py-1 rounded-full">
          <span className="text-accent text-xs font-bold">{members.length} Joueur{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {merged.map(({ member, rank, ratio }, index) => {
        const isCurrentUser = member.userId === currentUserId;
        const color = rankColors[index] ?? '#FFFFFF60';
        const hasPlayed = (rank?.gamesPlayed ?? 0) > 0;

        return (
          <div
            key={member.id}
            onClick={() => onSelectUser?.(member)}
            className={`flex items-center py-3 px-4 border-b border-line last:border-b-0 cursor-pointer hover:bg-white/5 transition-colors ${isCurrentUser ? 'bg-accent/5' : ''}`}
          >
            {/* Rank badge */}
            <div className="w-8 flex items-center justify-center mr-2 shrink-0">
              {index === 0 && hasPlayed && <Crown size={16} color="var(--gold)" />}
              {index === 1 && hasPlayed && <Medal size={16} color="#C0C0C0" />}
              {index === 2 && hasPlayed && <Medal size={16} color="#CD7F32" />}
              {(!hasPlayed || index > 2) && (
                <span className="text-txt-40 text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="relative mr-3 shrink-0">
              <Avatar name={member.username} avatarUrl={member.avatarUrl} size={36} />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${member.isOnline ? 'bg-accent' : 'bg-txt-40'}`} />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-semibold text-sm ${isCurrentUser ? 'text-accent' : 'text-txt'}`}>
                  {member.username}
                </span>
                {member.isOwner && (
                  <div className="flex items-center px-1.5 py-0.5 rounded-full bg-energy/15">
                    <Crown size={10} color="var(--gold)" />
                    <span className="text-energy text-[10px] font-medium ml-0.5">Chef</span>
                  </div>
                )}
              </div>
              <span className="text-txt-40 text-xs">
                {member.isOnline ? 'En ligne' : 'Hors ligne'}
                {hasPlayed ? ` • ${rank!.gamesPlayed} partie${rank!.gamesPlayed > 1 ? 's' : ''}` : ''}
              </span>
            </div>

            {/* Stats */}
            {hasPlayed && (
              <div className="text-right mr-3 shrink-0">
                <p className="font-bold text-sm" style={{ color }}>{Math.round(ratio)} <span className="text-txt-40 text-[10px] font-normal">moy</span></p>
                <p className="text-txt-40 text-[10px]">{rank!.gamesWon} 🏆</p>
              </div>
            )}

            <div onClick={(e) => e.stopPropagation()}>
              <FriendshipButton
                status={member.friendshipStatus}
                isCurrentUser={isCurrentUser}
                onAddFriend={() => onAddFriend(member.userId, member.username)}
                size="sm"
              />
            </div>
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
      <div className="relative bg-bg pb-20 rounded-t-3xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-line shrink-0">
          <div>
            <p className="text-txt font-bold text-xl">Historique des parties</p>
            <p className="text-txt-60 text-xs mt-0.5">{sessions.length} partie{sessions.length !== 1 ? 's' : ''} jouée{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
            <X size={20} color="#FFFFFF" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <History size={40} color="#FFFFFF20" />
              <p className="text-txt-40 text-center mt-3">Aucune partie terminée</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => { onNavigate(session); onClose(); }}
                className="flex items-center px-4 py-4 border-b border-line last:border-b-0 hover:bg-white/5 w-full text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#C0C0C020] flex items-center justify-center mr-3 shrink-0">
                  <Trophy size={18} color="#C0C0C0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-txt font-semibold">Partie #{session.code}</p>
                  <p className="text-txt-40 text-xs mt-0.5">
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
    }).catch(() => { }).finally(() => setIsLoading(false));
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
      <div className="relative bg-bg pb-20 rounded-t-3xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-line shrink-0">
          <div>
            <p className="text-txt font-bold text-xl">Inviter des amis</p>
            <p className="text-txt-60 text-xs mt-0.5">
              {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}` : 'Sélectionne des amis'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={20} color="#FFFFFF" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-6">
              <UserPlus size={40} color="#FFFFFF30" />
              <p className="text-txt-60 text-center mt-3">
                Aucun ami disponible à inviter
              </p>
              <p className="text-txt-40 text-sm text-center mt-1">
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
                  className={`flex items-center px-4 py-3 w-full transition-colors ${alreadyInvited ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 mr-3">
                    <Avatar name={friend.username} avatarUrl={friend.avatarUrl} size={36} />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-bg ${friend.isOnline ? 'bg-accent' : 'bg-txt-40'
                        }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className="text-txt font-semibold">{friend.username}</p>
                    <p className="text-txt-40 text-xs">
                      {alreadyInvited
                        ? 'Invitation déjà envoyée'
                        : `${friend.isOnline ? 'En ligne' : 'Hors ligne'}${friend.globalRank != null ? ` · #${friend.globalRank}` : ''}`
                      }
                    </p>
                  </div>

                  {/* Checkbox ou badge */}
                  {alreadyInvited ? (
                    <div className="px-2 py-1 rounded-lg bg-surface-2">
                      <span className="text-txt-40 text-xs">En attente</span>
                    </div>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                        ? 'bg-accent border-accent'
                        : 'border-line bg-transparent'
                        }`}
                    >
                      {isSelected && (
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                          <path d="M1 4L4.5 7.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <div className="px-4 py-4 border-t border-line shrink-0">
            <button
              onClick={handleSend}
              disabled={selected.size === 0 || isSending || sent}
              className={`w-full py-4 rounded-2xl flex items-center justify-center transition-colors font-bold text-base ${sent
                ? 'bg-accent/25 cursor-default'
                : selected.size === 0 || isSending
                  ? 'bg-surface-2 cursor-not-allowed'
                  : 'bg-accent hover:opacity-90 cursor-pointer'
                }`}
            >
              {sent ? (
                <span className="text-accent">Invitations envoyées ✓</span>
              ) : isSending ? (
                <span className="text-txt-60">Envoi en cours...</span>
              ) : (
                <span className={selected.size > 0 ? 'text-btn-fg' : 'text-txt-40'}>
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [roomData, setRoomData] = useState<RoomDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState<RoomDetailResponse['members'][number] | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrExpanded, setShowQrExpanded] = useState(false);
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

  // Refresh silencieux toutes les 10s (presence is now handled via WebSocket)
  useEffect(() => {
    const interval = setInterval(loadRoom, 10_000);
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
        PLAYING: `/session/${code}/game`,
        RESULTS: `/session/${code}/results`,
        PAUSED: `/session/${code}/game`,
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
    const msg = `Rejoins ma salle sur Xalaat (Quiz by MouhaDev) ! Code: ${room.code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Invitation Xalaat — Quiz by MouhaDev', text: msg }); } catch { /* cancelled */ }
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-4">
            <Sparkles size={40} color="var(--primary)" />
          </div>
          <p className="text-txt font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center mb-4">
            <Eye size={48} color="var(--txt-40)" />
          </div>
          <p className="text-txt-60 text-center mb-4">Salle introuvable</p>
          <button
            onClick={() => router.back()}
            className="bg-accent px-8 py-4 rounded-2xl hover:bg-accent-d transition-colors"
          >
            <span className="text-btn-fg font-bold">Retour</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-h-[100dvh] min-h-0 bg-bg flex flex-col overflow-hidden relative">
      {/* ── Header (Fixed shrink-0) ── */}
      <div className="flex items-center px-4 pt-4 pb-3 gap-3 shrink-0 bg-bg border-b border-line z-20">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0"
        >
          <ChevronRight size={20} color="var(--primary)" className="rotate-180" />
        </button>
        <p className="text-txt font-bold text-xl flex-1 truncate">Room #{room.name}</p>
        {isOwner && (
          <button
            onClick={() => router.push(`/room/${roomId}/edit`)}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center"
          >
            <Settings size={20} color="#FFFFFF80" />
          </button>
        )}
      </div>

      {/* ── Scrollable main content area (QR code + Code + Invite + Members table + Danger zone) ── */}
      <div className={`flex-1 min-h-0 px-4 pt-4 pb-48 flex flex-col gap-4 overscroll-contain touch-pan-y${showConfigModal ? ' overflow-hidden' : ' overflow-y-auto'}`}>

        {/* QR + Code (Dynamic: large when 1 member/alone, compact banner when 2+ members) */}
        {members.length <= 1 || showQrExpanded ? (
          <div className="bg-surface rounded-3xl border border-line p-4 flex flex-col items-center shrink-0 transition-all">
            {qrLoading ? (
              <div className="w-36 h-36 rounded-2xl bg-bg flex items-center justify-center mb-4">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrImage ? (
              <div className="bg-white p-2.5 rounded-2xl shadow-lg mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt="QR Code" className="w-36 h-36 object-contain" />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-2xl bg-bg flex flex-col items-center justify-center border border-dashed border-line mb-4">
                <QrCode size={32} color="#FFFFFF20" />
              </div>
            )}
            <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-1">Code de la salle</p>
            <p className="text-accent text-3xl font-bold tracking-[6px] select-all mb-1">{room.code}</p>
            {members.length > 1 && (
              <button
                type="button"
                onClick={() => setShowQrExpanded(false)}
                className="text-txt-60 hover:text-txt text-xs font-semibold underline mt-2 cursor-pointer"
              >
                Masquer le QR Code
              </button>
            )}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-line px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div>
              <p className="text-txt-40 text-[9px] font-bold tracking-widest uppercase">Code de la salle</p>
              <p className="text-accent text-xl font-bold tracking-[4px] select-all">{room.code}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowQrExpanded(true)}
              className="px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-txt font-bold text-xs hover:bg-surface-3 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode size={16} className="text-accent" />
              <span>Afficher le QR Code</span>
            </button>
          </div>
        )}

        {/* Invite button */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full py-4 rounded-2xl flex items-center justify-center bg-accent hover:opacity-90 transition-opacity shrink-0"
        >
          <UserPlus size={20} className="text-btn-fg" />
          <span className="text-btn-fg font-bold text-base ml-2">Inviter des amis</span>
        </button>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="shrink-0">
            <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-2">Session active</p>
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                onPress={() => navigateToSession(session)}
                onDelete={() => handleDeleteSession(session.id, session.code)}
                canDelete={isOwner || session.managerId === user?.id}
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
          onSelectUser={(m) => setSelectedUserModal(m)}
        />

        {/* Danger zone */}
        <div className="bg-surface rounded-3xl border border-line overflow-hidden mb-2 shrink-0">
          {!isOwner ? (
            <button
              onClick={handleLeaveRoom}
              className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors"
            >
              <LogOut size={18} color="var(--bad)" className="mr-3" />
              <span className="text-red-400 font-medium">Quitter la salle</span>
            </button>
          ) : (
            <button
              onClick={handleDeleteRoom}
              className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors"
            >
              <Trash2 size={18} color="var(--bad)" className="mr-3" />
              <span className="text-red-400 font-medium">Supprimer la salle</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Floating Sticky Action Bar (Fixed Dock above TabBar) ── */}
      <div className="fixed bottom-[88px] left-4 right-4 bg-surface/95 backdrop-blur-md border border-line px-4 py-3 flex items-center justify-between gap-3 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] z-30 pointer-events-auto">
        {/* Invite */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex flex-col items-center gap-1 flex-1 group cursor-pointer"
        >
          <UserPlus size={19} className="text-txt-60 group-hover:text-txt transition-colors" />
          <span className="text-txt-60 group-hover:text-txt text-[10px] font-medium uppercase tracking-wider transition-colors">Invite</span>
        </button>

        {/* Start Game — center pill */}
        <button
          onClick={hasActiveSession ? () => navigateToSession(activeSessions[0]) : handleCreateSession}
          className="flex items-center gap-2 px-4 py-3.5 rounded-full hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-md"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-d))' }}
        >
          <Play size={18} className="text-btn-fg" fill="currentColor" />
          <span className="text-btn-fg font-bold text-sm tracking-wider uppercase">
            {hasActiveSession ? 'Rejoindre' : 'Lancer la partie'}
          </span>
        </button>

        {/* Historique */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex flex-col items-center gap-1 flex-1 group cursor-pointer"
        >
          <History size={19} className="text-txt-60 group-hover:text-txt transition-colors" />
          <span className="text-txt-60 group-hover:text-txt text-[10px] font-medium uppercase tracking-wider transition-colors">Historique</span>
        </button>
      </div>

      {/* History Modal */}
      {showHistoryModal && mounted && createPortal(
        <HistoryModal
          sessions={pastSessions}
          onNavigate={navigateToSession}
          onClose={() => setShowHistoryModal(false)}
        />,
        document.body
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && mounted && createPortal(
        <InviteFriendsModal
          roomId={roomId}
          memberUserIds={members.map((m) => m.userId)}
          pendingInvitationUserIds={roomData?.pendingInvitationUserIds ?? []}
          onClose={() => setShowInviteModal(false)}
        />,
        document.body
      )}

      {/* Session Config Modal */}
      {showConfigModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-[9999] overscroll-contain">
          <div
            className="absolute inset-0"
            onClick={() => setShowConfigModal(false)}
          />
          <div className="relative bg-bg rounded-t-[32px] w-full max-w-2xl h-[92dvh] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl z-10 border-t border-line">
            <SessionConfigForm
              roomId={roomId}
              onSuccess={handleSessionCreated}
              onClose={() => setShowConfigModal(false)}
              initialMaxPlayers={members.length || undefined}
            />
          </div>
        </div>,
        document.body
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        visible={!!selectedUserModal}
        userId={selectedUserModal?.userId ?? null}
        username={selectedUserModal?.username}
        avatarUrl={selectedUserModal?.avatarUrl}
        onClose={() => setSelectedUserModal(null)}
      />
    </div>
  );
}
