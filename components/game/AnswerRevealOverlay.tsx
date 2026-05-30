'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface AnswerRevealOverlayProps {
  correctAnswer: string;
  winnerId: string | null;
  winnerName: string | null;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function AnswerRevealOverlay({
  correctAnswer,
  winnerId,
  winnerName,
  onDismiss,
  autoDismissMs = 3000,
}: AnswerRevealOverlayProps) {
  const isWinner = !!winnerId;

  useEffect(() => {
    if (!autoDismissMs) return;
    const t = setTimeout(() => onDismiss?.(), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-in fade-in duration-200"
      style={{ backgroundColor: isWinner ? '#00D397ee' : '#D5442Fee' }}
    >
      <div className="flex flex-col items-center gap-5 px-8">
        {isWinner ? (
          <CheckCircle size={64} className="text-white" />
        ) : (
          <XCircle size={64} className="text-white" />
        )}

        {isWinner ? (
          <p className="text-white text-xl font-bold text-center">
            🎉 {winnerName} a trouvé !
          </p>
        ) : (
          <p className="text-white text-lg font-semibold text-center opacity-90">
            Personne n'a trouvé
          </p>
        )}

        <div className="bg-white/20 rounded-2xl px-6 py-4 w-full text-center">
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-1">
            {isWinner ? 'Bonne réponse' : 'La bonne réponse était'}
          </p>
          <p className="text-white text-2xl font-bold">{correctAnswer}</p>
        </div>

        <p className="text-white/60 text-sm">Prochaine question dans 3s...</p>
      </div>
    </div>
  );
}
