'use client';

import { Trophy, Flame, Target, Award, BarChart3, Percent } from 'lucide-react';

import type { GlobalStats } from '~/types/api';

interface GlobalStatsCardProps {
  stats: GlobalStats;
}

function StatItem({
  icon: Icon,
  label,
  value,
  color = '#FFFFFF',
  suffix = '',
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string | number;
  color?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center flex-1">
      <div className="w-10 h-10 rounded-xl bg-[#3E366640] flex items-center justify-center mb-2">
        <Icon size={18} color={color} />
      </div>
      <p className="text-white font-bold text-lg">
        {value}{suffix}
      </p>
      <p className="text-white/50 text-xs text-center mt-0.5">{label}</p>
    </div>
  );
}

export function GlobalStatsCard({ stats }: GlobalStatsCardProps) {
  return (
    <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4">
      {/* Header */}
      <div className="flex flex-row items-center mb-4">
        <BarChart3 size={18} color="#FFFFFF" />
        <p className="text-white font-bold text-base ml-2">Classement Global</p>
        {stats.rank > 0 && (
          <div className="ml-auto bg-[#FFD70015] px-3 py-1 rounded-full">
            <span className="text-[#FFD700] text-sm font-bold">#{stats.rank}</span>
          </div>
        )}
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="flex flex-row justify-between mb-4">
        <StatItem
          icon={Trophy}
          label="Score total"
          value={stats.totalScore.toLocaleString('fr-FR')}
          color="#FFD700"
        />
        <StatItem
          icon={Flame}
          label="Parties"
          value={stats.totalGames}
          color="#D5442F"
        />
        <StatItem
          icon={Award}
          label="Victoires"
          value={stats.totalWins}
          color="#00D397"
        />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="flex flex-row justify-between">
        <StatItem
          icon={Target}
          label="Meilleur"
          value={stats.bestScore}
          color="#00D397"
        />
        <StatItem
          icon={Percent}
          label="Win rate"
          value={stats.winRate.toFixed(0)}
          suffix="%"
          color="#00D397"
        />
        <StatItem
          icon={BarChart3}
          label="Moy. score"
          value={stats.avgScore.toFixed(0)}
          color="#FFFFFF"
        />
      </div>
    </div>
  );
}
