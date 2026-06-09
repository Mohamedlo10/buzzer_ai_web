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

  // ── Waiting in queue state ──
  if (queuePosition !== null) {
    return (
      <div className="flex flex-col items-center py-6">
        <div
          className="flex flex-col items-center justify-center rounded-full border-[3px] border-line opacity-60 bg-gradient-to-br from-surface-2 to-bg"
          style={{ width: 192, height: 192 }}
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
          className="relative flex items-center justify-center rounded-full border-[3px] border-line opacity-60 overflow-hidden bg-gradient-to-br from-surface-2 to-bg"
          style={{ width: 192, height: 192 }}
        >
          <div className="absolute top-0 left-0 right-0 h-20 rounded-t-full pointer-events-none bg-gradient-to-b from-white/10 to-transparent" />
          <div className="flex flex-col items-center">
            {teamBuzzed ? (
              <span className="text-5xl mb-1 select-none">🔒</span>
            ) : (
              <Zap size={56} className="text-txt-40" strokeWidth={2} />
            )}
            <span className="text-txt-40 font-bold text-xl mt-2 tracking-wide">
              {teamBuzzed ? 'LOCK' : 'BUZZ'}
            </span>
          </div>
        </div>
        <p className="text-txt-40 mt-4 text-sm">
          {teamBuzzed ? 'Votre équipe a déjà buzzé' : 'Buzzer désactivé'}
        </p>
      </div>
    );
  }

  // ── Active buzzer ──
  return (
    <div className="flex flex-col items-center py-6">
      <button
        onClick={handleClick}
        disabled={!isActive}
        className="relative focus:outline-none active:scale-90 transition-transform duration-150 group"
        style={{ width: 200, height: 200 }}
      >
        {/* Outer pulse ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-[#D5442F] animate-ping opacity-30 pointer-events-none"
          style={{ top: -4, left: -4, width: 200, height: 200 }}
        />

        {/* Main button */}
        <div
          className="absolute inset-0 m-[4px] flex items-center justify-center rounded-full border-[3px] border-[#FF6B4A] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FF4444, #D5442F)',
            boxShadow: '0 6px 16px rgba(213,68,47,0.4)',
          }}
        >
          {/* Subtle top highlight */}
          <div
            className="absolute top-0 left-0 right-0 rounded-t-full pointer-events-none"
            style={{
              height: 80,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
            }}
          />
          <div className="flex flex-col items-center relative z-10">
            <Zap size={56} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
            <span className="text-white font-bold text-xl mt-2 tracking-wide">BUZZ</span>
          </div>
        </div>
      </button>

      <p className="text-txt-60 mt-4 text-sm">Cliquer ou appuyer sur Espace / Entrée</p>
    </div>
  );
}
