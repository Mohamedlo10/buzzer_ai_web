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
import { appStorage } from '~/lib/utils/storage';
import { UserProfileModal } from '~/components/shared/UserProfileModal';
import { Avatar } from '~/components/shared/Avatar';
import type { FriendResponse, RoomDetailResponse, RoomSessionResponse, SessionStatus } from '~/types/api';
import { notify } from '~/lib/ui/notify';
import { confirmAsync } from '~/lib/ui/confirm';

import { STATUS_CONFIG } from '~/components/room/STATUS_CONFIG';
import { RoomCodeCard } from '~/components/room/RoomCodeCard';
import { ActiveSessionCard } from '~/components/room/ActiveSessionCard';
import { MembersWithStats } from '~/components/room/MembersWithStats';
import { HistoryModal } from '~/components/room/HistoryModal';
import { InviteFriendsModal } from '~/components/room/InviteFriendsModal';

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

  const navigateToSession = async (session: RoomSessionResponse) => {
    const { code, status, id: sessionId } = session;

    await appStorage.setActiveSession({ sessionId, code });

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
    notify.success(`Le code ${room.code} a été copié.`);
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
    const confirmed = await confirmAsync({
      title: 'Quitter la salle ?',
      message: `Vous ne verrez plus "${room.name}" dans vos salles.`,
      confirmLabel: 'Quitter',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await roomsApi.leaveRoom(room.code);
      router.replace('/rooms');
    } catch (err) {
      notify.error('Impossible de quitter la salle');
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionCode: string) => {
    const confirmed = await confirmAsync({
      title: 'Supprimer la session ?',
      message: `La session ${sessionCode} sera définitivement supprimée.`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await sessionsApi.deleteSession(sessionId);
      await loadRoom();
    } catch (err) {
      notify.error('Impossible de supprimer la session');
    }
  };

  const handleDeleteRoom = async () => {
    const confirmed = await confirmAsync({
      title: 'Supprimer la salle ?',
      message: 'Cette action est irréversible. Toutes les statistiques seront perdues.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await roomsApi.deleteRoom(roomId);
      router.replace('/rooms');
    } catch (err) {
      notify.error('Impossible de supprimer la salle');
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
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <ChevronRight size={20} color="var(--primary)" className="rotate-180" />
        </button>
        <p className="text-txt font-bold text-xl flex-1 truncate">Room #{room.name}</p>
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors cursor-pointer text-txt-60 hover:text-txt"
          title="Historique des sessions"
        >
          <History size={18} />
        </button>
        {isOwner && (
          <button
            onClick={() => router.push(`/room/${roomId}/edit`)}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors cursor-pointer"
            title="Paramètres de la salle"
          >
            <Settings size={20} className="text-txt-60 hover:text-txt transition-colors" />
          </button>
        )}
      </div>

      {/* ── Scrollable main content area (QR code + Code + Invite + Members table + Danger zone) ── */}
      <div className={`flex-1 min-h-0 px-4 pt-4 pb-16 flex flex-col gap-4 overscroll-contain touch-pan-y${showConfigModal ? ' overflow-hidden' : ' overflow-y-auto'}`}>

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
          className="w-full py-4 rounded-2xl flex items-center justify-center bg-accent hover:opacity-90 transition-opacity shrink-0 cursor-pointer shadow-sm"
        >
          <UserPlus size={20} className="text-btn-fg" />
          <span className="text-btn-fg font-bold text-base ml-2">Inviter des amis</span>
        </button>

        {/* Active Sessions */}
        {activeSessions.length > 0 ? (
          <div className="shrink-0">
            <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-2">Session active</p>
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                members={members}
                onPress={() => navigateToSession(session)}
                onDelete={() => handleDeleteSession(session.id, session.code)}
                canDelete={isOwner || session.managerId === user?.id}
                isOwner={isOwner}
              />
            ))}
          </div>
        ) : (
          <button
            onClick={handleCreateSession}
            className="w-full py-4 rounded-2xl flex items-center justify-center bg-gradient-to-r from-accent to-gold text-btn-fg font-bold text-base shadow-glow-success hover:opacity-95 transition-all cursor-pointer shrink-0"
          >
            <Play size={20} className="text-btn-fg fill-current" />
            <span className="ml-2">🚀 CRÉER & LANCER UNE SESSION</span>
          </button>
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
              className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors cursor-pointer"
            >
              <LogOut size={18} color="var(--bad)" className="mr-3" />
              <span className="text-red-400 font-medium">Quitter la salle</span>
            </button>
          ) : (
            <button
              onClick={handleDeleteRoom}
              className="flex items-center px-5 py-4 hover:bg-white/5 w-full text-left transition-colors cursor-pointer"
            >
              <Trash2 size={18} color="var(--bad)" className="mr-3" />
              <span className="text-red-400 font-medium">Supprimer la salle</span>
            </button>
          )}
        </div>
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
