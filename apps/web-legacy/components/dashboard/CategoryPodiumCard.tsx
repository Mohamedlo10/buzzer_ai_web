'use client';

import { Trophy, Crosshair } from 'lucide-react';

import type { CategoryPodium } from '~/types/api';

interface CategoryPodiumCardProps {
  categories: CategoryPodium[];
}

const MEDALS = [
  { emoji: '🥇', color: 'var(--energy)' },
  { emoji: '🥈', color: 'var(--silver)' },
  { emoji: '🥉', color: 'var(--bronze)' },
];

function CategoryItem({ category, index }: { category: CategoryPodium; index: number }) {
  const medal = MEDALS[index] || MEDALS[2];

  return (
    <div
      className="flex-1 rounded-2xl px-1.5 py-3.5 flex flex-col items-center gap-0.5"
      style={{
        background: `color-mix(in oklab, ${medal.color} 12%, var(--surface))`,
      }}
    >
      <span className="text-2xl mb-0.5">{medal.emoji}</span>
      <p className="text-txt font-bold text-[12.5px] text-center truncate w-full px-1">
        {category.category}
      </p>
      <p className="font-display font-semibold text-[17px]" style={{ color: medal.color }}>
        {category.totalScore.toLocaleString('fr-FR')}
      </p>
      <p className="text-txt-40 text-[10px]">pts</p>
      <div className="flex flex-row items-center gap-1 mt-1 bg-bg px-2.5 py-[3px] rounded-full">
        <Crosshair size={10} className="text-accent" />
        <span className="text-accent text-[11px] font-semibold">
          {category.winRate.toFixed(0)}%
        </span>
      </div>
      <p className="text-txt-40 text-[10px] mt-1">{category.gamesPlayed} parties</p>
    </div>
  );
}

export function CategoryPodiumCard({ categories }: CategoryPodiumCardProps) {
  if (categories.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col items-center">
        <div className="flex flex-row items-center mb-3">
          <Trophy size={18} className="text-txt" />
          <p className="text-txt font-bold text-base ml-2">Mes meilleures catégories</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-3">
          <span className="text-2xl">🎯</span>
        </div>
        <p className="text-txt-60 text-sm text-center">
          Jouez votre première partie pour voir vos catégories favorites !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      {/* Header */}
      <div className="flex flex-row items-center mb-4">
        <Trophy size={18} className="text-energy" />
        <p className="text-txt font-bold text-base ml-2">Mes meilleures catégories</p>
      </div>

      {/* Podium */}
      <div className="flex flex-row gap-[9px]">
        {categories.map((cat, index) => (
          <CategoryItem key={cat.category} category={cat} index={index} />
        ))}
        {/* Fill empty slots */}
        {categories.length < 3 &&
          Array.from({ length: 3 - categories.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex-1 bg-surface-2/20 border border-dashed border-surface-2/50 rounded-2xl p-3 flex flex-col items-center justify-center"
            >
              <span className="text-txt-25 text-2xl mb-1">?</span>
              <span className="text-txt-25 text-xs text-center">À découvrir</span>
            </div>
          ))}
      </div>
    </div>
  );
}
