'use client';

import { useEffect } from 'react';
import { Zap } from 'lucide-react';

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  hasBuzzed?: boolean;
  queuePosition?: number | null;
  teamBuzzed?: boolean;
}

export function BuzzerButton({
  onBuzz,
  disabled = false,
  hasBuzzed = false,
  queuePosition = null,
  teamBuzzed = false,
}: BuzzerButtonProps) {
  const isActive = !disabled && !hasBuzzed && queuePosition === null;

  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      onBuzz();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, onBuzz]);

  const handleClick = () => {
    if (!isActive) return;
    onBuzz();
  };

  const size = 180;
  const color = 'var(--color-primary)';
  const ink = 'var(--color-primary-ink)';

  // ── Waiting in queue state ──
  if (queuePosition !== null) {
    return (
      <div className="flex flex-col items-center py-6">
        <div
          className="flex flex-col items-center justify-center rounded-full border-[3px] border-line opacity-60 bg-surface"
          style={{ width: size, height: size }}
        >
          <Zap size={36} className="text-txt-40" strokeWidth={2} />
          <span className="text-txt-60 font-bold text-2xl mt-1 tracking-wide">#{queuePosition}</span>
        </div>
        <p className="text-txt-40 mt-4 text-sm font-medium">En file d&apos;attente</p>
      </div>
    );
  }

  // ── Disabled state ──
  if (disabled) {
    return (
      <div className="flex flex-col items-center py-6">
        <div
          className="relative flex flex-col items-center justify-center rounded-full border border-line opacity-60 overflow-hidden bg-surface"
          style={{ width: size, height: size }}
        >
          {teamBuzzed ? (
            <span className="text-4xl mb-1 select-none">🔒</span>
          ) : (
            <Zap size={44} className="text-txt-40" strokeWidth={2} />
          )}
          <span className="text-txt-40 font-bold text-lg mt-2 tracking-wide">
            {teamBuzzed ? 'VERROUILLÉ' : 'BUZZ'}
          </span>
        </div>
        <p className="text-txt-40 mt-3 text-xs font-semibold">
          {teamBuzzed ? 'Votre équipe a déjà buzzé' : 'Buzzer désactivé'}
        </p>
      </div>
    );
  }

  // ── Active Xalaat Buzzer ──
  return (
    <div className="flex flex-col items-center py-4">
      <div
        style={{
          position: 'relative',
          width: size + 40,
          height: size + 40,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {/* Concentric halos */}
        <span
          style={{
            position: 'absolute',
            width: size + 40,
            height: size + 40,
            borderRadius: '50%',
            background: color,
            opacity: 0.18,
            animation: 'xal-halo 1.8s ease-out infinite',
          }}
        />
        <span
          style={{
            position: 'absolute',
            width: size + 40,
            height: size + 40,
            borderRadius: '50%',
            background: color,
            opacity: 0.12,
            animation: 'xal-halo 1.8s ease-out infinite',
            animationDelay: '0.6s',
          }}
        />

        {/* Outer ring */}
        <span
          style={{
            position: 'absolute',
            width: size + 18,
            height: size + 18,
            borderRadius: '50%',
            background: color,
            opacity: 0.22,
          }}
        />

        {/* Buzzer Button */}
        <button
          onClick={handleClick}
          type="button"
          style={{
            position: 'relative',
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            color: ink,
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 14px 32px -6px ${color}90, inset 0 -6px 0 rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.25)`,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            animation: 'xal-buzz 1.4s ease-in-out infinite',
            transformOrigin: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
          className="active:scale-95 transition-transform"
        >
          {/* Geometric SVG Lozenge mark inside */}
          <svg width={size * 0.32} height={size * 0.32} viewBox="0 0 80 80" style={{ opacity: 0.85 }}>
            <path d="M40 6 L74 40 L40 74 L6 40 Z" fill="none" stroke={ink} strokeOpacity="0.45" strokeWidth="2" />
            <path d="M40 22 L58 40 L40 58 L22 40 Z" fill={ink} fillOpacity="0.95" />
          </svg>
          <div style={{ fontSize: size * 0.12, lineHeight: 1, marginTop: 4 }}>BUZZER</div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.15)',
              color: ink,
              opacity: 0.85,
              fontFamily: 'var(--font-body)',
            }}
          >
            ESPACE
          </div>
        </button>
      </div>

      <p className="text-txt-60 mt-2 text-xs font-semibold">Appuyer ou cliquer sur ESPACE</p>

      <style jsx global>{`
        @keyframes xal-buzz {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes xal-halo {
          0% { transform: scale(0.85); opacity: 0.3; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
