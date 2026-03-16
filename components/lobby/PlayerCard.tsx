'use client';

import { User, Crown, Eye, X } from 'lucide-react';

import { Badge } from '~/components/ui/Badge';
import type { PlayerResponse } from '~/types/api';

interface PlayerCardProps {
  player: PlayerResponse;
  isManager?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
  isCurrentUser?: boolean;
}

export function PlayerCard({
  player,
  isManager = false,
  showRemove = false,
  onRemove,
  isCurrentUser = false,
}: PlayerCardProps) {
  return (
    <div
      className={`bg-[#342D5B] rounded-xl p-4 border mb-3 ${
        isCurrentUser ? 'border-[#00D397]' : 'border-[#3E3666]'
      }`}
      style={isCurrentUser ? { boxShadow: '0 0 8px rgba(0,211,151,0.2)' } : undefined}
    >
      <div className="flex flex-row items-center">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
            player.isSpectator ? 'bg-[#FFD70020]' : 'bg-[#3E3666]'
          }`}
        >
          {player.isSpectator ? (
            <Eye size={18} color="#FFD700" />
          ) : (
            <User size={18} color="#FFFFFF" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-row items-center flex-wrap gap-1.5">
            <span className={`font-semibold truncate ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}>
              {player.name}
            </span>
            {isManager && (
              <div className="flex flex-row items-center bg-[#FFD70020] px-2 py-0.5 rounded-full gap-1">
                <Crown size={10} color="#FFD700" />
                <span className="text-[#FFD700] text-xs">Manager</span>
              </div>
            )}
            {player.isSpectator && (
              <Badge variant="warning" className="ml-1">Spectateur</Badge>
            )}
            {isCurrentUser && (
              <span className="text-[#00D397] text-xs">(Vous)</span>
            )}
          </div>

          {/* Score if any */}
          {player.score > 0 && (
            <p className="text-white/50 text-xs mt-0.5">{player.score} pts</p>
          )}
        </div>

        {/* Remove button */}
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-[#D5442F20] flex items-center justify-center hover:bg-[#D5442F40] transition-colors flex-shrink-0"
          >
            <X size={16} color="#D5442F" />
          </button>
        )}
      </div>
    </div>
  );
}
