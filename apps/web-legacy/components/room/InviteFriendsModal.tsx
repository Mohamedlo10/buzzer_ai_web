import { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Avatar } from '~/components/shared/Avatar';
import type { FriendResponse } from '~/types/api';
import * as friendsApi from '~/lib/api/friends';
import * as roomsApi from '~/lib/api/rooms';
import { notify } from '~/lib/ui/notify';

export function InviteFriendsModal({
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
      notify.error("Impossible d'envoyer les invitations");
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
