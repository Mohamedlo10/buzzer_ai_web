'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface FocusModePanelProps {
  questionText: string;
  category: string;
  choices: string[];
  answerTimeSeconds: number;
  onSubmit: (chosenAnswer: string) => void;
  isSubmitting?: boolean;
  result?: 'correct' | 'wrong' | null;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function FocusModePanel({
  questionText,
  category,
  choices,
  answerTimeSeconds,
  onSubmit,
  isSubmitting = false,
  result = null,
}: FocusModePanelProps) {
  const [remaining, setRemaining] = useState(answerTimeSeconds);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    setRemaining(answerTimeSeconds);
    setSelectedIndex(null);
    hasSubmittedRef.current = false;

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            onSubmit('__timeout__');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [answerTimeSeconds, onSubmit]);

  useEffect(() => {
    if ((result || isSubmitting) && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [result, isSubmitting]);

  const handleSelect = (index: number, answer: string) => {
    if (hasSubmittedRef.current || isSubmitting || result) return;
    hasSubmittedRef.current = true;
    setSelectedIndex(index);
    if (timerRef.current) clearInterval(timerRef.current);
    onSubmit(answer);
  };

  const percent = Math.max(0, Math.min(100, (remaining / answerTimeSeconds) * 100));
  const timerColorClass =
    remaining <= answerTimeSeconds * 0.3
      ? 'bg-buzz text-buzz'
      : remaining <= answerTimeSeconds * 0.6
      ? 'bg-warn text-warn'
      : 'bg-accent text-accent';

  const isUrgent = remaining <= 3;

  return (
    <div
      className="fixed inset-0 z-50 bg-bg flex flex-col justify-between px-6 py-8 select-none shadow-[inset_0_0_100px_rgba(33,28,61,0.2)] dark:shadow-[inset_0_0_120px_rgba(0,0,0,0.45)]"
      style={{
        backgroundImage:
          'radial-gradient(120% 70% at 50% 0%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%)',
      }}
    >
      {/* Top Header Row */}
      <div className="flex flex-row items-center justify-between w-full">
        {/* Focus Mode chip */}
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-btn-fg text-xs font-bold shadow-md shadow-accent/20">
          <span className="w-1.5 h-1.5 rounded-full bg-btn-fg animate-pulse" />
          <span>🎯 Mode focus · à toi !</span>
        </div>

        {/* Circular Countdown Timer */}
        <div
          className={`w-[52px] h-[52px] rounded-full border-[3.5px] bg-surface flex items-center justify-center font-display font-bold text-lg shadow-lg relative shrink-0`}
          style={{
            borderColor:
              remaining <= answerTimeSeconds * 0.3
                ? '#D5442F'
                : remaining <= answerTimeSeconds * 0.6
                ? '#F59E0B'
                : '#00D397',
          }}
        >
          {/* Subtle spinning glow ring if active */}
          {!result && !isSubmitting && (
            <div
              className={`absolute inset-[-3.5px] rounded-full border-[3.5px] border-t-transparent animate-spin opacity-40`}
              style={{
                borderColor:
                  remaining <= answerTimeSeconds * 0.3
                    ? '#D5442F'
                    : remaining <= answerTimeSeconds * 0.6
                    ? '#F59E0B'
                    : '#00D397',
              }}
            />
          )}
          <span
            className="tabular-nums"
            style={{
              color:
                remaining <= answerTimeSeconds * 0.3
                  ? '#D5442F'
                  : remaining <= answerTimeSeconds * 0.6
                  ? '#F59E0B'
                  : 'var(--txt)',
            }}
          >
            {remaining}
          </span>
        </div>
      </div>

      {/* Middle Question Display */}
      <div className="flex flex-col items-center justify-center my-auto py-4 text-center max-w-lg mx-auto">
        <span className="text-accent text-[10px] font-bold tracking-[0.18em] uppercase mb-2">
          {category}
        </span>
        <h2 className="text-txt font-display font-semibold text-2xl text-center leading-normal tracking-wide text-pretty mb-6">
          {questionText}
        </h2>

        {/* Horizontal Timer Bar */}
        <div className="w-full max-w-sm h-1.5 bg-surface-2 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              remaining <= answerTimeSeconds * 0.3
                ? 'bg-buzz'
                : remaining <= answerTimeSeconds * 0.6
                ? 'bg-warn'
                : 'bg-accent'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Bottom Answer Choice List */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-3">
        {choices.map((choice, i) => {
          const isSelected = selectedIndex === i;
          const showCorrect = result === 'correct' && isSelected;
          const showWrong = result === 'wrong' && isSelected;
          const dimmed = selectedIndex !== null && !isSelected;

          const teamColor = 'var(--accent)';

          // Animations and inline styling for selected states
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i, choice)}
              disabled={hasSubmittedRef.current || isSubmitting || !!result}
              className={`flex items-center gap-3.5 w-full rounded-2xl border-[1.5px] p-4 min-h-[62px] text-left transition-all duration-150 active:scale-[0.98] disabled:cursor-default shadow-sm ${
                showCorrect
                  ? 'bg-accent/18 border-accent shadow-glow-success'
                  : showWrong
                  ? 'bg-buzz/18 border-buzz animate-[shake_0.4s_ease] shadow-glow-danger'
                  : isSelected
                  ? 'bg-[color-mix(in_oklab,_var(--accent)_22%,_var(--surface))] border-accent shadow-[0_0_0_3px_color-mix(in_oklab,_var(--accent)_30%,_transparent)]'
                  : 'bg-surface border-line hover:border-line/80'
              } ${dimmed ? 'opacity-40' : ''}`}
              style={{
                animationDelay: `${i * 60}ms`,
              }}
            >
              {/* Choice Label pastille */}
              <span
                className={`w-[36px] h-[36px] rounded-[11px] flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  isSelected ? 'bg-accent text-btn-fg' : 'bg-surface-2 text-txt'
                }`}
              >
                {CHOICE_LABELS[i]}
              </span>

              {/* Choice Content */}
              <span className="text-txt text-base font-semibold leading-snug flex-1">
                {choice}
              </span>

              {/* Validation Icons */}
              {showCorrect && <CheckCircle size={20} className="text-accent shrink-0" />}
              {showWrong && <XCircle size={20} className="text-buzz shrink-0" />}
            </button>
          );
        })}

        {/* Hint text */}
        <p
          className={`text-center text-xs mt-3 transition-colors duration-300 font-medium ${
            isUrgent ? 'text-buzz font-bold animate-pulse' : 'text-txt-60'
          }`}
        >
          {isUrgent ? '⏱ Vite, le temps file !' : 'Plus tu réponds vite, plus tu marques de points'}
        </p>
      </div>
    </div>
  );
}
