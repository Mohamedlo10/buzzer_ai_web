'use client';

import { useRouter } from 'next/navigation';
import { FolderOpen, Users, ChevronRight, Zap, UserCheck, Clock, UserX } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import type { LastRoom } from '~/types/api';

interface LastRoomCardProps {
  room: LastRoom;
}

export function LastRoomCard({ room }: LastRoomCardProps) {
  const router = useRouter();

  const getFriendshipIcon = () => {
    switch (room.ownerFriendshipStatus) {
      case 'ACCEPTED':
        return <UserCheck size={12} color="#00D397" />;
      case 'PENDING':
        return <Clock size={12} color="#F39C12" />;
      case 'DECLINED':
      case 'BLOCKED':
        return <UserX size={12} color="#FFFFFF40" />;
      default:
        return null;
    }
  };

  const friendshipIcon = getFriendshipIcon();

  return (
    <button
      onClick={() => router.push(`/room/${room.id}`)}
      className="w-full text-left active:opacity-90 hover:opacity-90 transition-opacity cursor-pointer"
    >
      <Card>
        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-3">
          <div className="flex flex-row items-center flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#3E3666] flex items-center justify-center mr-3 shrink-0">
              <FolderOpen size={20} color="#FFFFFF" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">{room.name}</p>
              <p className="text-white/50 text-xs">Code: {room.code}</p>
            </div>
          </div>
          <ChevronRight size={20} color="#FFFFFF" />
        </div>

        {/* Stats */}
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row items-center">
            <Users size={14} color="#FFFFFF" />
            <span className="text-white/60 text-sm ml-1.5">{room.memberCount}</span>
          </div>
          <div className="flex flex-row items-center">
            <span className="text-white/40 text-xs">By {room.ownerName}</span>
            {friendshipIcon && <span className="ml-1">{friendshipIcon}</span>}
          </div>
          {room.hasActiveSession && (
            <Badge variant="success">
              <div className="flex flex-row items-center">
                <Zap size={10} color="#00D397" />
                <span className="text-[#00D397] text-xs font-semibold ml-1">Active</span>
              </div>
            </Badge>
          )}
        </div>
      </Card>
    </button>
  );
}
