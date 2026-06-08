'use client';

import { Avatar } from '~/components/ui/Avatar';
import type { SessionRankingEntry } from '~/types/api';

const MEDALS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
const PODIUM_HEIGHT: Record<number, number> = { 1: 150, 2: 120, 3: 96 };

interface PodiumProps {
  rankings: SessionRankingEntry[];
  currentUserId?: string;
  onPlayerTap?: (entry: SessionRankingEntry) => void;
}

export function Podium({ rankings, currentUserId, onPlayerTap }: PodiumProps) {
  if (rankings.length < 1) return null;

  const top3 = rankings.slice(0, 3);
  const displayOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
  : [top3[0]];

  return (
    <div className="flex items-end justify-center gap-2.5 mt-1 mb-2 px-1">
      {displayOrder.map((entry) => {
        const rank = rankings.findIndex((r) => r.player.id === entry.player.id) + 1;
        const medal = MEDALS[rank - 1] ?? '#00D397';
        const height = PODIUM_HEIGHT[rank] ?? 100;
        const isYou = (entry.player.userId ?? entry.player.id) === currentUserId;

        return (
          <button
            key={entry.player.id}
            type="button"
            onClick={() => onPlayerTap?.(entry)}
            className="flex-1 flex flex-col items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 animate-[rise_0.55s_both]"
          >
            {rank === 1 && (
              <span className="text-[22px] leading-none animate-[float_3s_ease-in-out_infinite]">👑</span>
            )}
            <Avatar
              avatarUrl={entry.player.avatarUrl}
              username={entry.player.name}
              size={rank === 1 ? 54 : 44}
              borderColor={medal}
            />
            <span className="text-[12.5px] font-bold w-full text-center truncate text-txt">
              {isYou ? 'Toi' : entry.player.name}
            </span>
            <div
              className="w-full rounded-t-xl pt-2 flex flex-col items-center text-[#11112a] animate-[rise_0.55s_both]"
              style={{
                height,
                background: `linear-gradient(180deg, ${medal}, color-mix(in oklab, ${medal} 35%, var(--surface)))`,
              }}
            >
              <span className="font-display font-semibold text-2xl">{rank}</span>
              <span className="font-bold text-[13px]">{entry.finalScore}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
