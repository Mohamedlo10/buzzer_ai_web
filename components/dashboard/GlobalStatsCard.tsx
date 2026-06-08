'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Flame, Target, Award, BarChart3, Percent } from 'lucide-react';

import type { GlobalStats } from '~/types/api';

interface GlobalStatsCardProps {
  stats: GlobalStats;
}

function StatItem({
  icon: Icon,
  label,
  value,
  color = 'var(--txt)',
  suffix = '',
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string | number;
  color?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center flex-1 gap-1.5">
      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
        <Icon size={18} color={color} />
      </div>
      <p className="font-display font-semibold text-[17px] text-txt">
        {value}{suffix}
      </p>
      <p className="text-txt-60 text-[11px] text-center leading-tight">{label}</p>
    </div>
  );
}

export function GlobalStatsCard({ stats }: GlobalStatsCardProps) {
  const router = useRouter();

  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      {/* Header */}
      <div className="flex flex-row items-center mb-4">
        <BarChart3 size={18} className="text-txt-60" />
        <p className="text-txt font-bold text-sm ml-2">Classement global</p>
        {stats.rank > 0 && (
          <button
            onClick={() => router.push('/rankings')}
            className="ml-auto px-2.5 py-1 rounded-full bg-energy/15 hover:bg-energy/25 transition-colors cursor-pointer"
          >
            <span className="text-energy text-sm font-bold">#{stats.rank}</span>
          </button>
        )}
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="flex flex-row justify-between mb-4">
        <StatItem icon={Trophy} label="Score total" value={stats.totalScore.toLocaleString('fr-FR')} color="var(--energy)" />
        <StatItem icon={Flame} label="Parties" value={stats.totalGames} color="var(--buzz)" />
        <StatItem icon={Award} label="Victoires" value={stats.totalWins} color="var(--accent)" />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="flex flex-row justify-between">
        <StatItem icon={Target} label="Meilleur" value={stats.bestScore} color="var(--accent)" />
        <StatItem icon={Percent} label="Win rate" value={stats.winRate.toFixed(0)} suffix="%" color="var(--accent)" />
        <StatItem icon={BarChart3} label="Moy. score" value={stats.avgScore.toFixed(0)} color="var(--txt)" />
      </div>
    </div>
  );
}
