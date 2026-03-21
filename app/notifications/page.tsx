'use client';

import { useRouter } from 'next/navigation';
import { Bell, UserPlus, Gamepad2, FolderOpen, Check, X, ChevronLeft, ArrowRight } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import { useNotifications } from '~/lib/query/hooks';
import * as friendsApi from '~/lib/api/friends';
import * as invitationsApi from '~/lib/api/invitations';
import * as roomsApi from '~/lib/api/rooms';
import { appStorage } from '~/lib/utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '~/lib/query/keys';

export default function NotificationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useNotifications();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications });
    qc.invalidateQueries({ queryKey: queryKeys.dashboardV2 });
  };

  const handleAcceptFriend = async (requestId: string) => {
    try {
      await friendsApi.acceptFriendRequest(requestId);
      invalidate();
    } catch {
      alert("Impossible d'accepter la demande");
    }
  };

  const handleDeclineFriend = async (requestId: string) => {
    try {
      await friendsApi.declineFriendRequest(requestId);
      invalidate();
    } catch {
      alert('Impossible de refuser la demande');
    }
  };

  const handleAcceptGame = async (invitationId: string, sessionCode: string) => {
    try {
      await invitationsApi.acceptInvitation(invitationId);
      invalidate();
      router.push(`/session/${sessionCode}/lobby`);
    } catch {
      alert("Impossible d'accepter l'invitation");
    }
  };

  const handleDeclineGame = async (invitationId: string) => {
    try {
      await invitationsApi.declineInvitation(invitationId);
      invalidate();
    } catch {
      alert("Impossible de refuser l'invitation");
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    try {
      const data = await roomsApi.joinRoom(roomCode);
      invalidate();
      router.push(`/room/${data.room.id}`);
    } catch {
      alert('Impossible de rejoindre la salle');
    }
  };

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="flex flex-row items-center px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </button>
        <p className="text-white font-bold text-2xl">Notifications</p>
        {data && data.total > 0 && (
          <span className="ml-3 bg-[#D5442F] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {data.total}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <Spinner text="Chargement..." className="py-12" />
        ) : !data || data.total === 0 ? (
          <Card className="flex flex-col items-center py-16 mt-4">
            <Bell size={48} color="#FFFFFF40" className="mb-4" />
            <p className="text-white/60 text-center font-medium">Aucune notification</p>
            <p className="text-white/40 text-center text-sm mt-2 px-8">
              Vos demandes d'amis, invitations de jeu et de salle apparaîtront ici
            </p>
          </Card>
        ) : (
          <>
            {/* ── Friend Requests ── */}
            {data.friendRequests.length > 0 && (
              <div className="mb-6">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <UserPlus size={14} />
                  Demandes d'amis ({data.friendRequests.length})
                </p>
                {data.friendRequests.map((req) => (
                  <Card key={req.id} className="mb-3">
                    <div className="flex flex-row items-center">
                      <div className="w-11 h-11 rounded-full bg-[#3E3666] flex items-center justify-center mr-3 shrink-0">
                        <UserPlus size={20} color="#FFFFFF" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{req.requester.username}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white/50 text-sm">Veut vous ajouter</p>
                          {req.requester.globalRank != null && (
                            <span className="text-[#00D397] text-xs font-semibold">#{req.requester.globalRank}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <button
                          onClick={() => handleAcceptFriend(req.id)}
                          className="w-10 h-10 rounded-full bg-[#00D397] flex items-center justify-center hover:bg-[#00C085] transition-colors cursor-pointer"
                        >
                          <Check size={18} color="#292349" />
                        </button>
                        <button
                          onClick={() => handleDeclineFriend(req.id)}
                          className="w-10 h-10 rounded-full bg-[#D5442F] flex items-center justify-center hover:bg-[#C03020] transition-colors cursor-pointer"
                        >
                          <X size={18} color="#FFFFFF" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* ── Game Invitations ── */}
            {data.gameInvitations.length > 0 && (
              <div className="mb-6">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Gamepad2 size={14} />
                  Invitations de jeu ({data.gameInvitations.length})
                </p>
                {data.gameInvitations.map((inv) => (
                  <Card key={inv.id} className="mb-3">
                    <div className="flex flex-row items-center">
                      <div className="w-11 h-11 rounded-full bg-[#00D39720] flex items-center justify-center mr-3 shrink-0">
                        <Gamepad2 size={20} color="#00D397" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{inv.senderName}</p>
                        <p className="text-white/50 text-sm">
                          Session <span className="text-white/70 font-mono">{inv.sessionCode}</span>
                        </p>
                      </div>
                      <div className="flex flex-row gap-2">
                        <button
                          onClick={() => handleAcceptGame(inv.id, inv.sessionCode)}
                          className="w-10 h-10 rounded-full bg-[#00D397] flex items-center justify-center hover:bg-[#00C085] transition-colors cursor-pointer"
                        >
                          <Check size={18} color="#292349" />
                        </button>
                        <button
                          onClick={() => handleDeclineGame(inv.id)}
                          className="w-10 h-10 rounded-full bg-[#3E3666] flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <X size={18} color="#FFFFFF80" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* ── Room Invitations ── */}
            {data.roomInvitations.length > 0 && (
              <div className="mb-6">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FolderOpen size={14} />
                  Invitations de salle ({data.roomInvitations.length})
                </p>
                {data.roomInvitations.map((inv) => (
                  <Card key={inv.id} className="mb-3">
                    <div className="flex flex-row items-center">
                      <div className="w-11 h-11 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 shrink-0">
                        <FolderOpen size={20} color="#FFFFFF" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{inv.roomName}</p>
                        <p className="text-white/50 text-sm">
                          Invité par <span className="text-white/70">{inv.senderUsername}</span>
                        </p>
                      </div>
                      {inv.isAlreadyMember ? (
                        <div className="px-3 py-2 rounded-lg bg-[#00D39720]">
                          <span className="text-[#00D397] text-sm font-medium">Déjà membre</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinRoom(inv.roomCode)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#00D397] hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <span className="text-[#292349] font-semibold text-sm">Rejoindre</span>
                          <ArrowRight size={14} color="#292349" />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        <div className="h-8" />
      </div>
    </SafeScreen>
  );
}
