'use client';

import { Trophy } from 'lucide-react';
import { Avatar } from '~/components/ui/Avatar';
import type { PlayerResponse } from '~/types/api';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

interface LiveLeaderboardProps {
  players: PlayerResponse[];
  currentUserId?: string;
  onPlayerTap?: (player: PlayerResponse) => void;
  onCorrectClick?: () => void;
}

export function LiveLeaderboard({ players, currentUserId, onPlayerTap, onCorrectClick }: LiveLeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-energy/5">
        <div className="flex items-center gap-2">
          <Trophy size={15} color="#FFD700" />
          <span className="text-txt font-bold text-sm">Classement</span>
        </div>
        {onCorrectClick ? (
          <button
            onClick={onCorrectClick}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-energy/10 border border-energy/30 text-energy text-xs font-semibold cursor-pointer hover:bg-energy/20 transition-colors flex items-center gap-1"
          >
            <span>✎</span> Corriger
          </button>
        ) : (
          <span className="text-txt-40 text-xs">{players.length} joueurs</span>
        )}
      </div>

      {top3.length > 0 && (
        <div className={`flex gap-2 px-3 py-3 ${rest.length > 0 ? 'border-b border-line' : ''}`}>
          {top3.map((player, index) => {
            const isYou = player.userId === currentUserId;
            const medalColor = MEDAL_COLORS[index];
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onPlayerTap?.(player)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-colors ${
                  isYou ? 'bg-accent/12 border border-accent' : 'bg-bg border border-line'
                }`}
              >
                <Avatar
                  avatarUrl={player.avatarUrl}
                  username={player.name}
                  size={34}
                  borderColor={index === 0 ? '#FFD700' : medalColor}
                />
                <span className="text-[11px] font-semibold w-full text-center truncate text-txt">
                  {isYou ? 'Toi' : player.name}
                </span>
                <span className="font-display font-semibold text-sm" style={{ color: medalColor }}>
                  {player.score}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {rest.map((player, index) => {
        const isYou = player.userId === currentUserId;
        return (
          <button
            key={player.id}
            type="button"
            onClick={() => onPlayerTap?.(player)}
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors ${
              index < rest.length - 1 ? 'border-b border-line' : ''
            } ${isYou ? 'bg-accent/9' : 'hover:bg-surface-2/50'}`}
          >
            <span className="w-[18px] text-center font-display font-semibold text-sm text-txt-40">
              {index + 4}
            </span>
            <Avatar
              avatarUrl={player.avatarUrl}
              username={player.name}
              size={28}
              borderColor={isYou ? '#00D397' : undefined}
            />
            <span className={`flex-1 text-[13px] font-semibold truncate ${isYou ? 'text-accent' : 'text-txt'}`}>
              {isYou ? 'Toi (Vous)' : player.name}
            </span>
            <span className="text-[13px] font-semibold text-txt">
              {player.score} <span className="text-txt-40 text-[10px]">pts</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
