'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}

export function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className="bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]"
      style={{ boxShadow: `0 2px 8px 0 ${color}1a` }}
    >
      <div className="flex flex-row items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={20} color={color} />
        </div>
        {change !== undefined && (
          <div
            className={`flex flex-row items-center gap-1 px-2 py-1 rounded-full ${
              isPositive ? 'bg-[#00D39720]' : isNegative ? 'bg-[#D5442F20]' : 'bg-[#3E3666]'
            }`}
          >
            {isPositive && <TrendingUp size={12} color="#00D397" />}
            {isNegative && <TrendingDown size={12} color="#D5442F" />}
            <span
              className={`text-xs font-medium ${
                isPositive ? 'text-[#00D397]' : isNegative ? 'text-[#D5442F]' : 'text-white/60'
              }`}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
          </div>
        )}
      </div>
      <p className="text-white/60 text-sm mb-1">{title}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}
