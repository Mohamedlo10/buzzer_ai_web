'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '~/stores/useGameStore';
import { performanceMonitor } from '~/lib/utils/performance';

interface LatencyDebugProps {
  visible?: boolean;
}

export function LatencyDebug({ visible = process.env.NODE_ENV === 'development' }: LatencyDebugProps) {
  const [stats, setStats] = useState(performanceMonitor.getLatencyStats());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setStats(performanceMonitor.getLatencyStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="absolute top-12 right-4 bg-black/80 rounded-lg p-2 min-w-[120px]">
      <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <span className="text-white text-xs font-mono">
          Latency: {stats.recentLatency}ms
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1">
          <p className="text-white/70 text-xs font-mono">
            Avg: {stats.averageLatency}ms
          </p>
          <p className="text-white/70 text-xs font-mono">
            Min: {stats.minLatency}ms
          </p>
          <p className="text-white/70 text-xs font-mono">
            Max: {stats.maxLatency}ms
          </p>

          <button
            onClick={() => {
              performanceMonitor.reset();
              setStats({ averageLatency: 0, minLatency: 0, maxLatency: 0, recentLatency: 0 });
            }}
            className="mt-2 bg-red-600 px-2 py-1 rounded"
          >
            <span className="text-white text-xs">Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
