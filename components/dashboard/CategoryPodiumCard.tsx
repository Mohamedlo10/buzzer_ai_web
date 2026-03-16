'use client';

import { Trophy, Crosshair } from 'lucide-react';

import type { CategoryPodium } from '~/types/api';

interface CategoryPodiumCardProps {
  categories: CategoryPodium[];
}

const MEDAL_CONFIG = [
  { emoji: '🥇', bgColor: 'bg-[#FFD70015]', borderColor: 'border-[#FFD70030]', textColor: 'text-[#FFD700]' },
  { emoji: '🥈', bgColor: 'bg-[#C0C0C015]', borderColor: 'border-[#C0C0C030]', textColor: 'text-[#C0C0C0]' },
  { emoji: '🥉', bgColor: 'bg-[#CD7F3215]', borderColor: 'border-[#CD7F3230]', textColor: 'text-[#CD7F32]' },
];

function CategoryItem({ category, index }: { category: CategoryPodium; index: number }) {
  const medal = MEDAL_CONFIG[index] || MEDAL_CONFIG[2];

  return (
    <div className={`flex-1 ${medal.bgColor} border ${medal.borderColor} rounded-2xl p-3 flex flex-col items-center`}>
      {/* Medal */}
      <span className="text-2xl mb-2">{medal.emoji}</span>

      {/* Category name */}
      <p className="text-white font-bold text-sm text-center truncate w-full">
        {category.category}
      </p>

      {/* Score */}
      <p className={`${medal.textColor} font-bold text-lg mt-1`}>{category.totalScore}</p>
      <p className="text-white/40 text-xs">pts</p>

      {/* Win rate */}
      <div className="flex flex-row items-center mt-2 bg-[#292349] px-2 py-1 rounded-full">
        <Crosshair size={10} color="#00D397" />
        <span className="text-[#00D397] text-xs font-semibold ml-1">
          {category.winRate.toFixed(0)}%
        </span>
      </div>

      {/* Games played */}
      <p className="text-white/30 text-xs mt-1.5">{category.gamesPlayed} parties</p>
    </div>
  );
}

export function CategoryPodiumCard({ categories }: CategoryPodiumCardProps) {
  if (categories.length === 0) {
    return (
      <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-6 flex flex-col items-center">
        <div className="flex flex-row items-center mb-3">
          <Trophy size={18} color="#FFFFFF" />
          <p className="text-white font-bold text-base ml-2">Mes meilleures catégories</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-[#3E3666] flex items-center justify-center mb-3">
          <span className="text-2xl">🎯</span>
        </div>
        <p className="text-white/50 text-sm text-center">
          Jouez votre première partie pour voir vos catégories favorites !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4">
      {/* Header */}
      <div className="flex flex-row items-center mb-4">
        <Trophy size={18} color="#FFD700" />
        <p className="text-white font-bold text-base ml-2">Mes meilleures catégories</p>
      </div>

      {/* Podium */}
      <div className="flex flex-row gap-2">
        {categories.map((cat, index) => (
          <CategoryItem key={cat.category} category={cat} index={index} />
        ))}
        {/* Fill empty slots */}
        {categories.length < 3 &&
          Array.from({ length: 3 - categories.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex-1 bg-[#3E366620] border border-dashed border-[#3E366640] rounded-2xl p-3 flex flex-col items-center justify-center"
            >
              <span className="text-white/20 text-2xl mb-1">?</span>
              <span className="text-white/20 text-xs text-center">À découvrir</span>
            </div>
          ))}
      </div>
    </div>
  );
}
