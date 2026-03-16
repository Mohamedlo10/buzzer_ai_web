'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────

interface WSLogEntry {
  id: number;
  timestamp: string;
  source: 'WS' | 'POLL' | 'SYNC';
  type: string;
  detail: string;
  color: string;
}

interface WSDebugStats {
  wsEvents: number;
  pollSyncs: number;
  reconnects: number;
  lastWsEvent: string | null;
  lastPollSync: string | null;
  isConnected: boolean;
  pollIntervalMs: number;
}

// ─── Singleton debug logger (importable from anywhere) ──────

let _nextId = 1;
let _entries: WSLogEntry[] = [];
let _stats: WSDebugStats = {
  wsEvents: 0,
  pollSyncs: 0,
  reconnects: 0,
  lastWsEvent: null,
  lastPollSync: null,
  isConnected: false,
  pollIntervalMs: 0,
};
let _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

function getTimeStr(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
}

const EVENT_COLORS: Record<string, string> = {
  buzzer_pressed: '#FF6B6B',
  answer_validated: '#51CF66',
  question_start: '#339AF0',
  buzzer_reset: '#FCC419',
  answer_skipped: '#FF922B',
  game_over: '#CC5DE8',
  game_paused: '#FCC419',
  game_resumed: '#51CF66',
  score_updated: '#20C997',
  player_joined: '#748FFC',
  player_left: '#868E96',
  generation_progress: '#339AF0',
  generation_complete: '#51CF66',
  _connection_change: '#74C0FC',
  _reconnected: '#FF922B',
};

export const wsDebugLogger = {
  /** Log a WebSocket event received */
  logWsEvent(type: string, detail?: string) {
    const entry: WSLogEntry = {
      id: _nextId++,
      timestamp: getTimeStr(),
      source: 'WS',
      type,
      detail: detail || '',
      color: EVENT_COLORS[type] || '#FFFFFF',
    };
    _entries = [entry, ..._entries].slice(0, 50); // keep last 50
    _stats.wsEvents++;
    _stats.lastWsEvent = getTimeStr();
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔌 [WS] ${type}${detail ? ` → ${detail}` : ''}`);
    }
    notify();
  },

  /** Log a polling sync */
  logPollSync(detail?: string) {
    const entry: WSLogEntry = {
      id: _nextId++,
      timestamp: getTimeStr(),
      source: 'POLL',
      type: 'sync',
      detail: detail || 'full state sync',
      color: '#868E96',
    };
    _entries = [entry, ..._entries].slice(0, 50);
    _stats.pollSyncs++;
    _stats.lastPollSync = getTimeStr();
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [POLL] sync${detail ? ` → ${detail}` : ''}`);
    }
    notify();
  },

  /** Log connection state change */
  setConnected(connected: boolean) {
    _stats.isConnected = connected;
    if (!connected) {
      _stats.reconnects++;
    }
    notify();
  },

  /** Log current polling interval */
  setPollInterval(ms: number) {
    _stats.pollIntervalMs = ms;
    notify();
  },

  getEntries: () => _entries,
  getStats: () => ({ ..._stats }),

  subscribe(fn: () => void) {
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  },

  reset() {
    _entries = [];
    _stats = {
      wsEvents: 0,
      pollSyncs: 0,
      reconnects: 0,
      lastWsEvent: null,
      lastPollSync: null,
      isConnected: false,
      pollIntervalMs: 0,
    };
    _nextId = 1;
    notify();
  },
};

// ─── React Component ────────────────────────────────────────

export function WebSocketDebug({ visible = process.env.NODE_ENV === 'development' }: { visible?: boolean }) {
  const [, forceUpdate] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    if (!visible) return;
    return wsDebugLogger.subscribe(() => forceUpdate((n) => n + 1));
  }, [visible]);

  if (!visible) return null;

  const stats = wsDebugLogger.getStats();
  const entries = wsDebugLogger.getEntries();

  const wsRatio = stats.wsEvents + stats.pollSyncs > 0
    ? Math.round((stats.wsEvents / (stats.wsEvents + stats.pollSyncs)) * 100)
    : 0;

  return (
    <div className="absolute bottom-24 left-2 right-2" style={{ pointerEvents: 'none' }}>
      {/* Compact bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-black/90 rounded-xl px-3 py-2 flex-row items-center justify-between"
        style={{ pointerEvents: 'auto', width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.9)', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {/* Connection dot */}
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              stats.isConnected ? 'bg-[#51CF66]' : 'bg-[#FF6B6B]'
            }`}
          />
          <span className="text-white text-xs font-mono font-bold">
            WS {stats.isConnected ? 'ON' : 'OFF'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <span className="text-[#339AF0] text-xs font-mono">
            WS:{stats.wsEvents}
          </span>
          <span className="text-[#868E96] text-xs font-mono">
            POLL:{stats.pollSyncs}
          </span>
          <span className="text-white/50 text-xs font-mono">
            {wsRatio}% WS
          </span>
          <span className="text-white/30 text-xs font-mono">
            {stats.pollIntervalMs > 0 ? `${stats.pollIntervalMs / 1000}s` : '—'}
          </span>
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="bg-black/95 rounded-xl mt-1 p-3 max-h-72" style={{ pointerEvents: 'auto' }}>
          {/* Stats grid */}
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <div className="bg-[#339AF0]/20 rounded-lg px-2 py-1">
              <p className="text-[#339AF0] text-[10px] font-mono">WS Events</p>
              <p className="text-white text-sm font-mono font-bold">{stats.wsEvents}</p>
            </div>
            <div className="bg-[#868E96]/20 rounded-lg px-2 py-1">
              <p className="text-[#868E96] text-[10px] font-mono">Poll Syncs</p>
              <p className="text-white text-sm font-mono font-bold">{stats.pollSyncs}</p>
            </div>
            <div className="bg-[#FF922B]/20 rounded-lg px-2 py-1">
              <p className="text-[#FF922B] text-[10px] font-mono">Reconnects</p>
              <p className="text-white text-sm font-mono font-bold">{stats.reconnects}</p>
            </div>
            <div className="bg-[#51CF66]/20 rounded-lg px-2 py-1">
              <p className="text-[#51CF66] text-[10px] font-mono">WS Ratio</p>
              <p className="text-white text-sm font-mono font-bold">{wsRatio}%</p>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1">
              <p className="text-white/50 text-[10px] font-mono">Poll interval</p>
              <p className="text-white text-sm font-mono font-bold">
                {stats.pollIntervalMs > 0 ? `${stats.pollIntervalMs / 1000}s` : '—'}
              </p>
            </div>
          </div>

          {/* Last events */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <span className="text-white/40 text-[10px] font-mono" style={{ flex: 1 }}>
              Last WS: {stats.lastWsEvent || '—'} · Last Poll: {stats.lastPollSync || '—'}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => setShowLog(!showLog)}
              className="bg-white/10 rounded-lg px-3 py-1.5"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <span className="text-white text-xs font-mono">
                {showLog ? 'Masquer log' : 'Voir log'}
              </span>
            </button>
            <button
              onClick={() => wsDebugLogger.reset()}
              className="bg-[#FF6B6B]/20 rounded-lg px-3 py-1.5"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <span className="text-[#FF6B6B] text-xs font-mono">Reset</span>
            </button>
          </div>

          {/* Event log */}
          {showLog && (
            <div className="max-h-40" style={{ overflowY: 'auto' }}>
              {entries.length === 0 ? (
                <p className="text-white/30 text-xs font-mono text-center py-4">
                  Aucun event reçu
                </p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-white/30 text-[10px] font-mono" style={{ width: 80 }}>
                      {entry.timestamp}
                    </span>
                    <div
                      className="rounded px-1.5 py-0.5 mr-2"
                      style={{ backgroundColor: entry.source === 'WS' ? '#339AF020' : '#868E9620' }}
                    >
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{ color: entry.source === 'WS' ? '#339AF0' : '#868E96' }}
                      >
                        {entry.source}
                      </span>
                    </div>
                    <span
                      className="text-xs font-mono"
                      style={{ color: entry.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {entry.type}
                    </span>
                    {entry.detail ? (
                      <span className="text-white/30 text-[10px] font-mono" style={{ maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.detail}
                      </span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
