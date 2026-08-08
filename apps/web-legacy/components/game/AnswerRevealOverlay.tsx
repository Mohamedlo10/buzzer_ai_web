'use client';

import { useEffect, useState } from 'react';
import { PatternLozenge } from '~/components/shared/PatternLozenge';

interface AnswerRevealOverlayProps {
  correctAnswer: string;
  winnerId: string | null;
  winnerName: string | null;
  allAnswersWrong?: boolean;
  isManager?: boolean;
  onDismiss?: () => void;
  onAdvance?: () => void;
  autoDismissMs?: number;
}

export function AnswerRevealOverlay({
  correctAnswer,
  winnerId,
  winnerName,
  allAnswersWrong = false,
  isManager = false,
  onDismiss,
  onAdvance,
  autoDismissMs = 3000,
}: AnswerRevealOverlayProps) {
  const isWinner = !!winnerId;
  const goodColor = '#2D8559';
  const badColor = 'var(--color-primary)';
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvance = () => {
    if (isAdvancing || !onAdvance) return;
    setIsAdvancing(true);
    onAdvance();
  };

  useEffect(() => {
    if (allAnswersWrong) return;
    if (!autoDismissMs) return;
    const t = setTimeout(() => onDismiss?.(), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, allAnswersWrong, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-scrim/90 backdrop-blur-md animate-[fadein_0.2s_both] items-center justify-center p-6">
      {/* Background lozenge pattern bloom */}
      <svg
        width="600"
        height="600"
        viewBox="0 0 600 600"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      >
        <path d="M300 50 L550 300 L300 550 L50 300 Z" fill="none" stroke={isWinner ? goodColor : badColor} strokeWidth="1.5" />
        <path d="M300 120 L480 300 L300 480 L120 300 Z" fill="none" stroke={isWinner ? goodColor : badColor} strokeWidth="1.5" />
      </svg>

      <div className="relative z-10 w-full max-w-lg bg-surface border border-line rounded-[var(--card-radius)] p-8 text-center animate-[pop_0.4s_both]">
        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px 8px 12px',
            borderRadius: 'var(--radius-pill)',
            background: isWinner ? goodColor : badColor,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {isWinner ? '✓' : '✕'}
          </span>
          {isWinner ? 'BONNE RÉPONSE !' : allAnswersWrong ? 'AUCUNE BONNE RÉPONSE' : 'MAUVAISE RÉPONSE'}
        </div>

        {/* Title / Hero score text */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--font-display-weight)' as any,
            fontSize: 48,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: isWinner ? goodColor : 'var(--color-ink)',
          }}
        >
          {isWinner ? (
            <>
              {winnerName ?? 'Un joueur'}<br />
              <span style={{ fontSize: 24, color: 'var(--color-ink-soft)', fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontWeight: 400 }}>
                remporte la manche !
              </span>
            </>
          ) : (
            <>
              Oups !<br />
              <span style={{ fontSize: 22, color: 'var(--color-ink-soft)', fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontWeight: 400 }}>
                {allAnswersWrong ? 'Personne n\'a trouvé la bonne réponse' : 'La réponse était incorrecte'}
              </span>
            </>
          )}
        </h2>

        {/* Correct answer card */}
        <div
          style={{
            background: 'var(--color-bg)',
            borderRadius: 'var(--card-radius)',
            border: '1px solid var(--color-line)',
            padding: 18,
            marginTop: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-soft)', fontWeight: 700, marginBottom: 6 }}>
            {isWinner ? 'Réponse validée' : 'La bonne réponse était'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 22,
              color: 'var(--color-ink)',
            }}
          >
            {correctAnswer}
          </div>
        </div>

        {/* Manager Action / Auto-advance */}
        {allAnswersWrong && onAdvance && isManager ? (
          <button
            onClick={handleAdvance}
            disabled={isAdvancing}
            style={{
              width: '100%',
              background: isAdvancing ? 'var(--color-line)' : 'var(--color-primary)',
              color: 'var(--color-primary-ink)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 700,
              cursor: isAdvancing ? 'not-allowed' : 'pointer',
              opacity: isAdvancing ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isAdvancing ? 'Passage en cours…' : 'Question suivante →'}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-txt-60 text-xs font-semibold">
            <span className="dotpulse" />
            {isWinner ? 'Passage à la suite…' : 'En attente des autres joueurs…'}
          </div>
        )}
      </div>
    </div>
  );
}
