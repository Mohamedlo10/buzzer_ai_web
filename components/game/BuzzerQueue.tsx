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
      <div className="bg-surface rounded-xl p-4 border border-line">
        <p className="text-txt-60 text-center">En attente de buzzes...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="px-4 py-3 bg-surface-2 border-b border-line">
        <p className="text-txt font-semibold">File d&apos;attente</p>
      </div>

      <div className="max-h-40 overflow-y-auto">
        {queue.map((item, index) => {
          const isFirst = index === 0;
          const isCurrentUser = item.playerId === currentPlayerId;
          const isManager = item.playerId === managerPlayerId;

          return (
            <div
              key={item.playerId}
              className={`flex flex-row items-center px-4 py-3 border-b border-line last:border-b-0 transition-all duration-300 ${
                isFirst ? 'bg-accent/10' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 ${
                  isFirst ? 'bg-accent' : 'bg-surface-2'
                }`}
              >
                <span className={`font-bold text-sm ${isFirst ? 'text-btn-fg' : 'text-txt'}`}>
                  {index + 1}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center mr-3 shrink-0 text-txt-60">
                <User size={14} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-row items-center gap-1.5 flex-wrap">
                  <span className={`font-medium truncate ${isCurrentUser ? 'text-accent' : 'text-txt'}`}>
                    {item.playerName}
                  </span>
                  {isCurrentUser && <span className="text-accent text-xs">(Vous)</span>}
                  {isManager && <Crown size={12} className="text-energy" />}
                </div>
              </div>

              <div className="flex flex-row items-center gap-1 shrink-0 text-txt-40">
                <Clock size={12} />
                <span className="text-txt-60 text-sm">
                  {item.timeDiffMs < 1000
                    ? `${item.timeDiffMs}ms`
                    : `${(item.timeDiffMs / 1000).toFixed(1)}s`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {queue.length > 0 && (
        <div className="px-4 py-2 bg-accent/20 border-t border-accent/40">
          <p className="text-accent text-sm text-center">
            🎯 Tour de {queue[0].playerName}
          </p>
        </div>
      )}
    </div>
  );
}
