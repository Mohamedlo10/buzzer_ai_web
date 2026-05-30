'use client';

interface GlobalTimerBarProps {
  totalSeconds: number;
  remainingSeconds: number;
  paused?: boolean;
}

export function GlobalTimerBar({ totalSeconds, remainingSeconds, paused = false }: GlobalTimerBarProps) {
  const pct = totalSeconds > 0 ? Math.min(100, Math.round((remainingSeconds / totalSeconds) * 100)) : 0;
  const color = pct > 60 ? '#00D397' : pct > 30 ? '#F59E0B' : '#D5442F';

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex-1 h-1.5 bg-[#3E3666] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${paused ? 'opacity-50' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className={`text-xs font-bold w-7 text-right ${paused ? 'opacity-50' : ''}`}
        style={{ color }}
      >
        {remainingSeconds}
      </span>
      {paused && (
        <span className="text-white/30 text-[10px] font-bold tracking-widest">⏸</span>
      )}
    </div>
  );
}
