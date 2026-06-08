'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { Badge } from '~/components/ui/Badge';
import { Avatar } from '~/components/ui/Avatar';
import { PlayerProfileModal } from '~/components/ui/PlayerProfileModal';
import type { FriendResponse } from '~/types/api';

interface FriendCardProps {
  friend: FriendResponse;
}

export function FriendCard({ friend }: FriendCardProps) {
  const [showProfile, setShowProfile] = useState(false);

  const timeSinceLastSeen = friend.lastSeenAt
    ? formatTimeSince(new Date(friend.lastSeenAt))
    : null;

  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="w-full text-left bg-surface rounded-xl p-4 border border-line mb-3 hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
      >
        <div className="flex flex-row items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar avatarUrl={friend.avatarUrl} username={friend.username} size={48} />
            {/* Online status dot */}
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-surface ${
                friend.isOnline ? 'bg-accent' : 'bg-txt-40'
              }`}
            />
          </div>

          {/* Info */}
          <div className="flex-1 ml-3">
            <p className="text-txt font-semibold text-lg">{friend.username}</p>
            <div className="flex flex-row items-center gap-2">
              {friend.isOnline ? (
                <Badge variant="success">En ligne</Badge>
              ) : timeSinceLastSeen ? (
                <span className="text-txt-40 text-sm">Vu {timeSinceLastSeen}</span>
              ) : (
                <span className="text-txt-40 text-sm">Hors ligne</span>
              )}
              {friend.globalRank != null && (
                <span className="text-accent text-xs font-semibold">
                  #{friend.globalRank}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight size={20} className="text-txt-40" />
        </div>
      </button>

      {showProfile && (
        <PlayerProfileModal userId={friend.id} onClose={() => setShowProfile(false)} />
      )}
    </>
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
