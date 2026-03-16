'use client';

import { Crown, Medal, Trophy } from 'lucide-react';
import type { SessionRankingEntry } from '~/types/api';

interface PodiumProps {
  rankings: SessionRankingEntry[];
}

export function Podium({ rankings }: PodiumProps) {
  if (rankings.length < 3) return null;

  const [first, second, third] = rankings;

  return (
    <div className="flex flex-row items-end justify-center py-8 px-4">
      {/* 2nd place */}
      <div
        className="flex flex-col items-center mx-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '200ms' }}
      >
        <div className="w-20 h-24 bg-[#C0C0C0] rounded-t-xl flex items-end justify-center pb-2">
          <span className="text-[#292349] font-bold text-2xl">2</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-[#3E3666] border-2 border-[#C0C0C0] flex items-center justify-center -mt-7 mb-2">
          <Medal size={24} color="#C0C0C0" />
        </div>
        <p className="text-white font-semibold text-center truncate max-w-[80px]">
          {second.player.name}
        </p>
        <p className="text-[#C0C0C0] text-sm">{second.finalScore} pts</p>
      </div>

      {/* 1st place */}
      <div
        className="flex flex-col items-center mx-2 -mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '100ms' }}
      >
        <Crown size={32} color="#FFD700" className="mb-2" />
        <div className="w-24 h-32 bg-[#FFD700] rounded-t-xl flex items-end justify-center pb-2">
          <span className="text-[#292349] font-bold text-3xl">1</span>
        </div>
        <div className="w-16 h-16 rounded-full bg-[#3E3666] border-[3px] border-[#FFD700] flex items-center justify-center -mt-8 mb-2">
          <Trophy size={28} color="#FFD700" />
        </div>
        <p className="text-white font-bold text-lg text-center truncate max-w-[96px]">
          {first.player.name}
        </p>
        <p className="text-[#FFD700] font-semibold">{first.finalScore} pts</p>
      </div>

      {/* 3rd place */}
      <div
        className="flex flex-col items-center mx-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '300ms' }}
      >
        <div className="w-20 h-20 bg-[#CD7F32] rounded-t-xl flex items-end justify-center pb-2">
          <span className="text-[#292349] font-bold text-2xl">3</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-[#3E3666] border-2 border-[#CD7F32] flex items-center justify-center -mt-7 mb-2">
          <Medal size={24} color="#CD7F32" />
        </div>
        <p className="text-white font-semibold text-center truncate max-w-[80px]">
          {third.player.name}
        </p>
        <p className="text-[#CD7F32] text-sm">{third.finalScore} pts</p>
      </div>
    </div>
  );
}
