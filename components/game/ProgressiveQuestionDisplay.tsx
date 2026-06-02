'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ProgressiveQuestionDisplayProps {
  text: string;
  wordIndex: number;
  isRunning: boolean;
  speedMs?: number;
  onWordAdvance?: (index: number) => void;
  onFullyDisplayed?: () => void;
}

export function ProgressiveQuestionDisplay({
  text,
  wordIndex,
  isRunning,
  speedMs = 600,
  onWordAdvance,
  onFullyDisplayed,
}: ProgressiveQuestionDisplayProps) {
  const words = text.split(' ');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(wordIndex);
  currentIndexRef.current = wordIndex;
  const onFullyDisplayedRef = useRef(onFullyDisplayed);
  onFullyDisplayedRef.current = onFullyDisplayed;
  const hasCalledOnCompleteRef = useRef(false);

  const advance = useCallback(() => {
    if (currentIndexRef.current < words.length - 1) {
      const next = currentIndexRef.current + 1;
      onWordAdvance?.(next);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if (!hasCalledOnCompleteRef.current) {
        hasCalledOnCompleteRef.current = true;
        onFullyDisplayedRef.current?.();
      }
    }
  }, [words.length, onWordAdvance]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (isRunning && wordIndex < words.length - 1) {
      hasCalledOnCompleteRef.current = false;
      timerRef.current = setInterval(advance, speedMs);
    } else if (wordIndex >= words.length - 1 && !hasCalledOnCompleteRef.current) {
      hasCalledOnCompleteRef.current = true;
      onFullyDisplayedRef.current?.();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, wordIndex, words.length, speedMs, advance]);

  const revealedText = words.slice(0, wordIndex + 1).join(' ');
  const isFullyRevealed = wordIndex >= words.length - 1;

  return (
    <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-5">
      <p className="text-[#00D397] text-[10px] font-bold tracking-widest uppercase mb-3">Question</p>
      <p className="text-white text-lg leading-relaxed font-medium min-h-[5rem]">
        {revealedText}
        {!isFullyRevealed && isRunning && (
          <span
            className="inline-block w-[2px] h-[1.1em] bg-white/50 ml-1 align-text-bottom animate-pulse"
            aria-hidden
          />
        )}
      </p>
    </div>
  );
}
