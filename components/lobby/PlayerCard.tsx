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
      className={`bg-surface rounded-xl p-4 border mb-3 transition-shadow ${
        isCurrentUser ? 'border-accent shadow-[0_0_8px_rgba(0,211,151,0.2)]' : 'border-line'
      }`}
    >
      <div className="flex flex-row items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${
            player.isSpectator ? 'bg-energy/20 text-energy' : 'bg-surface-2 text-txt-60'
          }`}
        >
          {player.isSpectator ? <Eye size={18} /> : <User size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-row items-center flex-wrap gap-1.5">
            <span className={`font-semibold truncate ${isCurrentUser ? 'text-accent' : 'text-txt'}`}>
              {player.name}
            </span>
            {isManager && (
              <div className="flex flex-row items-center bg-energy/20 px-2 py-0.5 rounded-full gap-1">
                <Crown size={10} className="text-energy" />
                <span className="text-energy text-xs">Manager</span>
              </div>
            )}
            {player.isSpectator && (
              <Badge variant="warning" className="ml-1">Spectateur</Badge>
            )}
            {isCurrentUser && <span className="text-accent text-xs">(Vous)</span>}
          </div>

          {player.score > 0 && (
            <p className="text-txt-60 text-xs mt-0.5">{player.score} pts</p>
          )}
        </div>

        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-buzz/20 flex items-center justify-center hover:bg-buzz/40 transition-colors shrink-0 text-buzz"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
