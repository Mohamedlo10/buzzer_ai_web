'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  change?: number;
  changeLabel?: string;
}

export function KpiCard({ title, value, icon: Icon, iconColor, iconBg, change, changeLabel }: KpiCardProps) {
  const isPositive = change != null && change >= 0;
  return (
    <div className="bg-surface rounded-2xl p-5 border border-line">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={22} color={iconColor} />
        </div>
        {change != null && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-txt text-2xl font-bold">{value}</p>
      <p className="text-txt-60 text-sm mt-1">{title}</p>
      {changeLabel && <p className="text-txt/30 text-xs mt-0.5">{changeLabel}</p>}
    </div>
  );
}
