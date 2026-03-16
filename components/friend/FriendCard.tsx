'use client';

import { useRouter } from 'next/navigation';
import { User, Trash2, UserPlus } from 'lucide-react';

import { Badge } from '~/components/ui/Badge';
import type { FriendResponse } from '~/types/api';

interface FriendCardProps {
  friend: FriendResponse;
  onRemove?: () => void;
  onInvite?: () => void;
}

export function FriendCard({ friend, onRemove, onInvite }: FriendCardProps) {
  const router = useRouter();

  const timeSinceLastSeen = friend.lastSeenAt
    ? formatTimeSince(new Date(friend.lastSeenAt))
    : null;

  return (
    <button
      onClick={() => router.push(`/profile/${friend.id}`)}
      className="w-full text-left bg-[#342D5B] rounded-xl p-4 border border-[#3E3666] mb-3 hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
    >
      <div className="flex flex-row items-center">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#3E3666] flex items-center justify-center">
            <User size={24} color="#FFFFFF" />
          </div>
          {/* Online status dot */}
          <span
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#342D5B] ${
              friend.isOnline ? 'bg-[#00D397]' : 'bg-[#6B7280]'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 ml-3">
          <p className="text-white font-semibold text-lg">{friend.username}</p>
          <div className="flex flex-row items-center">
            {friend.isOnline ? (
              <Badge variant="success" className="mr-2">En ligne</Badge>
            ) : timeSinceLastSeen ? (
              <span className="text-white/40 text-sm">Vu {timeSinceLastSeen}</span>
            ) : (
              <span className="text-white/40 text-sm">Hors ligne</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row">
          {onInvite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInvite();
              }}
              className="w-10 h-10 rounded-full bg-[#00D39720] flex items-center justify-center mr-2 hover:bg-[#00D39730] transition-colors cursor-pointer"
            >
              <UserPlus size={18} color="#00D397" />
            </button>
          )}

          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-10 h-10 rounded-full bg-[#D5442F20] flex items-center justify-center hover:bg-[#D5442F30] transition-colors cursor-pointer"
            >
              <Trash2 size={18} color="#D5442F" />
            </button>
          )}
        </div>
      </div>
    </button>
  );
}

function formatTimeSince(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 30) return `il y a ${days}j`;
  return 'il y a longtemps';
}
