'use client';

import { useEffect } from 'react';

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

  useEffect(() => {
    if (allAnswersWrong) return; // manager controls progression
    if (!autoDismissMs) return;
    const t = setTimeout(() => onDismiss?.(), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, allAnswersWrong, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-scrim/90 backdrop-blur-sm animate-[fadein_0.2s_both]">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-[pop_0.5s_both]">
        <div className="text-[54px] leading-none mb-3">{isWinner ? '🎉' : '😬'}</div>
        <h2 className={`text-[30px] font-bold ${isWinner ? 'text-accent' : 'text-buzz'}`}>
          {isWinner ? 'Bonne réponse !' : 'Raté…'}
        </h2>
        <p className="text-txt-60 text-sm mt-1.5 max-w-xs">
          {isWinner
            ? `${winnerName ?? 'Un joueur'} a trouvé la bonne réponse`
            : 'Personne n\'a trouvé — voici la solution'}
        </p>

        <div className="bg-surface rounded-2xl border border-line px-6 py-4 mt-6 w-full max-w-sm">
          <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-1">
            {isWinner ? 'Bonne réponse' : 'La bonne réponse était'}
          </p>
          <p className="text-txt text-2xl font-bold">{correctAnswer}</p>
        </div>

        {allAnswersWrong && isManager && (
          <button
            onClick={onAdvance}
            className="mt-6 px-6 py-3 rounded-2xl bg-accent text-white font-semibold text-[15px] active:scale-95 transition-transform"
          >
            Question suivante →
          </button>
        )}

        {allAnswersWrong && !isManager && (
          <p className="mt-4 text-txt-40 text-[13px]">En attente du manager…</p>
        )}
      </div>

      {!allAnswersWrong && (
        <div className="pb-10 flex items-center justify-center gap-2 text-txt-60 text-[12.5px]">
          <span className="dotpulse" />
          Question suivante…
        </div>
      )}
    </div>
  );
}
