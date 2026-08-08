'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import {
  Settings, Trash2, Play, UserPlus, LogOut, Sparkles, ChevronRight, History, QrCode, Eye,
} from 'lucide-react';

import { SessionConfigForm } from '~/components/session/SessionConfigForm';
import { useRoomDetail } from '~/lib/hooks/useRoomDetail';
import * as qrcodeApi from '~/lib/api/qrcode';
import { UserProfileModal } from '~/components/shared/UserProfileModal';
import { notify } from '~/lib/ui/notify';
import { ActiveSessionCard } from '~/components/room/ActiveSessionCard';
import { MembersWithStats } from '~/components/room/MembersWithStats';
import { HistoryModal } from '~/components/room/HistoryModal';
import { InviteFriendsModal } from '~/components/room/InviteFriendsModal';

export default function RoomDetailPage() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    roomData,
    isLoading,
    showConfigModal,
    setShowConfigModal,
    showInviteModal,
    setShowInviteModal,
    showHistoryModal,
    setShowHistoryModal,
    selectedUserModal,
    setSelectedUserModal,
    showQrExpanded,
    setShowQrExpanded,
    user,
    room,
    isOwner,
    members,
    rankings,
    activeSessions,
    pastSessions,
    navigateToSession,
    handleSessionCreated,
    handleSendFriendRequest,
    handleLeaveRoom,
    handleDeleteSession,
    handleDeleteRoom,
  } = useRoomDetail({
    roomId: roomId ?? '',
    onNavigate: (path) => router.push(path),
    onReplaceRoute: (path) => router.replace(path),
  });

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadQR = useCallback(async (rId: string) => {
    setQrLoading(true);
    try {
      const blob = await qrcodeApi.getRoomQR(rId);
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
    if (roomData?.room?.id) loadQR(roomData.room.id);
  }, [roomData?.room?.id, loadQR]);

  useEffect(() => {
    document.body.style.overflow = showConfigModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showConfigModal]);

  const handleCreateSession = () => {
    setShowConfigModal(true);
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

        {/* QR + Code */}
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
          roomId={roomId ?? ''}
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
              roomId={roomId ?? ''}
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
