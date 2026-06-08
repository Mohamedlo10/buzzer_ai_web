'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface AnswerChoicesPanelProps {
  choices: string[];
  answerTimeSeconds: number;
  onSubmit: (chosenAnswer: string) => void;
  isSubmitting?: boolean;
  result?: 'correct' | 'wrong' | null;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AnswerChoicesPanel({
  choices,
  answerTimeSeconds,
  onSubmit,
  isSubmitting = false,
  result = null,
}: AnswerChoicesPanelProps) {
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

  const pct = Math.round((remaining / answerTimeSeconds) * 100);
  const timerColor = remaining > answerTimeSeconds * 0.6
    ? '#00D397'
    : remaining > answerTimeSeconds * 0.3
    ? '#F59E0B'
    : '#D5442F';

  return (
    <div className="flex flex-col gap-4 animate-[rise_0.4s_both]">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, backgroundColor: timerColor }}
          />
        </div>
        <span className="font-bold text-sm w-8 text-right tabular-nums" style={{ color: timerColor }}>
          {remaining}s
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {choices.map((choice, i) => {
          const isSelected = selectedIndex === i;
          const showCorrect = result === 'correct' && isSelected;
          const showWrong = result === 'wrong' && isSelected;
          const dimmed = selectedIndex !== null && !isSelected;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i, choice)}
              disabled={hasSubmittedRef.current || isSubmitting || !!result}
              className={`flex items-center gap-2.5 w-full rounded-[14px] border-[1.5px] p-3.5 min-h-[58px] text-left transition-all duration-150 active:scale-[0.98] disabled:cursor-default ${
                showCorrect ? 'bg-accent/18 border-accent' :
                showWrong ? 'bg-buzz/18 border-buzz animate-[shake_0.4s_ease]' :
                isSelected ? 'bg-accent/18 border-accent' :
                'bg-surface border-line'
              } ${dimmed ? 'opacity-45' : ''}`}
            >
              <span className="w-[30px] h-[30px] rounded-[9px] bg-surface-2 flex items-center justify-center text-txt font-bold text-[13px] shrink-0">
                {CHOICE_LABELS[i]}
              </span>
              <span className="text-txt text-[14.5px] font-semibold leading-snug flex-1">{choice}</span>
              {showCorrect && <CheckCircle size={18} className="text-accent shrink-0" />}
              {showWrong && <XCircle size={18} className="text-buzz shrink-0" />}
            </button>
          );
        })}
      </div>

      <p className="text-txt-60 text-xs text-center">Réponds vite pour maximiser tes points</p>
    </div>
  );
}
