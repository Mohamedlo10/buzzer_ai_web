'use client';

import { User, Clock, Crown } from 'lucide-react';
import type { BuzzQueueItem } from '~/types/api';

interface BuzzerQueueProps {
  queue: BuzzQueueItem[];
  currentPlayerId?: string;
  managerPlayerId?: string;
}

export function BuzzerQueue({ queue, currentPlayerId, managerPlayerId }: BuzzerQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="bg-[#342D5B] rounded-xl p-4 border border-[#3E3666]">
        <p className="text-white/50 text-center">En attente de buzzes...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#342D5B] rounded-xl border border-[#3E3666] overflow-hidden">
      <div className="px-4 py-3 bg-[#3E3666]">
        <p className="text-white font-semibold">File d'attente</p>
      </div>

      <div className="max-h-40 overflow-y-auto">
        {queue.map((item, index) => {
          const isFirst = index === 0;
          const isCurrentUser = item.playerId === currentPlayerId;
          const isManager = item.playerId === managerPlayerId;

          return (
            <div
              key={item.playerId}
              className={`flex flex-row items-center px-4 py-3 border-b border-[#3E3666] last:border-b-0 transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${
                isFirst ? 'bg-[#00D39710]' : ''
              }`}
            >
              {/* Position badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                  isFirst ? 'bg-[#00D397]' : 'bg-[#3E3666]'
                }`}
              >
                <span className={`font-bold text-sm ${isFirst ? 'text-[#292349]' : 'text-white'}`}>
                  {index + 1}
                </span>
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#3E3666] flex items-center justify-center mr-3 flex-shrink-0">
                <User size={14} color="#FFFFFF" />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-row items-center gap-1.5 flex-wrap">
                  <span className={`font-medium truncate ${isCurrentUser ? 'text-[#00D397]' : 'text-white'}`}>
                    {item.playerName}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[#00D397] text-xs">(Vous)</span>
                  )}
                  {isManager && (
                    <Crown size={12} color="#FFD700" />
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex flex-row items-center gap-1 flex-shrink-0">
                <Clock size={12} color="#FFFFFF40" />
                <span className="text-white/50 text-sm">
                  {item.timeDiffMs < 1000
                    ? `${item.timeDiffMs}ms`
                    : `${(item.timeDiffMs / 1000).toFixed(1)}s`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current turn indicator */}
      {queue.length > 0 && (
        <div className="px-4 py-2 bg-[#00D39720] border-t border-[#00D39740]">
          <p className="text-[#00D397] text-sm text-center">
            🎯 Tour de {queue[0].playerName}
          </p>
        </div>
      )}
    </div>
  );
}
