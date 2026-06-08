'use client';

import { useRouter } from 'next/navigation';
import { FolderOpen, Users, ChevronRight, Zap, UserCheck, Clock, UserX } from 'lucide-react';

import type { LastRoom } from '~/types/api';

interface LastRoomCardProps {
  room: LastRoom;
}

export function LastRoomCard({ room }: LastRoomCardProps) {
  const router = useRouter();

  const getFriendshipIcon = () => {
    switch (room.ownerFriendshipStatus) {
      case 'ACCEPTED':
        return <UserCheck size={12} className="text-accent" />;
      case 'PENDING':
        return <Clock size={12} className="text-warn" />;
      case 'DECLINED':
      case 'BLOCKED':
        return <UserX size={12} className="text-txt-40" />;
      default:
        return null;
    }
  };

  const friendshipIcon = getFriendshipIcon();

  return (
    <button
      onClick={() => router.push(`/room/${room.id}`)}
      className="w-full text-left bg-surface border border-line rounded-2xl p-4 hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
    >
      {/* Header */}
      <div className="flex flex-row items-center justify-between mb-3">
        <div className="flex flex-row items-center flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mr-3 shrink-0">
            <FolderOpen size={20} className="text-txt" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-txt font-bold text-base truncate">{room.name}</p>
            <p className="text-txt-60 text-xs">Code: {room.code}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-txt-40 shrink-0" />
      </div>

      {/* Stats */}
      <div className="flex flex-row items-center gap-4">
        <div className="flex flex-row items-center">
          <Users size={14} className="text-txt-60" />
          <span className="text-txt-60 text-sm ml-1.5">{room.memberCount}</span>
        </div>
        <div className="flex flex-row items-center min-w-0">
          <span className="text-txt-40 text-xs truncate">By {room.ownerName}</span>
          {friendshipIcon && <span className="ml-1 shrink-0">{friendshipIcon}</span>}
        </div>
        {room.hasActiveSession ? (
          <span className="ml-auto px-2.5 py-1 rounded-full bg-accent/15 flex flex-row items-center shrink-0">
            <Zap size={10} className="text-accent" />
            <span className="text-accent text-xs font-semibold ml-1">Active</span>
          </span>
        ) : (
          <span className="ml-auto px-2.5 py-1 rounded-full bg-surface-2 flex flex-row items-center shrink-0">
            <Zap size={10} className="text-txt-40" />
            <span className="text-txt-60 text-xs font-semibold ml-1">Inactif</span>
          </span>
        )}
      </div>
    </button>
  );
}
