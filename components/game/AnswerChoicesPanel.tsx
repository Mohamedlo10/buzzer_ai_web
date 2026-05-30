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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[#3E3666] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, backgroundColor: timerColor }}
          />
        </div>
        <span className="text-white font-bold text-sm w-8 text-right" style={{ color: timerColor }}>
          {remaining}s
        </span>
      </div>

      {choices.map((choice, i) => {
        const isSelected = selectedIndex === i;
        const showCorrect = result === 'correct' && isSelected;
        const showWrong = result === 'wrong' && isSelected;

        let borderColor = 'border-[#3E3666]';
        let bgColor = 'bg-[#342D5B]';
        if (showCorrect) { borderColor = 'border-[#00D397]'; bgColor = 'bg-[#00D39720]'; }
        if (showWrong) { borderColor = 'border-[#D5442F]'; bgColor = 'bg-[#D5442F20]'; }

        return (
          <button
            key={i}
            onClick={() => handleSelect(i, choice)}
            disabled={hasSubmittedRef.current || isSubmitting || !!result}
            className={`flex items-center gap-4 w-full ${bgColor} rounded-xl border ${borderColor} p-4 h-14 text-left active:scale-95 transition-all duration-150 disabled:opacity-60`}
          >
            <span className="w-8 h-8 rounded-lg bg-[#3E3666] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {CHOICE_LABELS[i]}
            </span>
            <span className="text-white text-base font-medium flex-1">{choice}</span>
            {showCorrect && <CheckCircle size={20} className="text-[#00D397] shrink-0" />}
            {showWrong && <XCircle size={20} className="text-[#D5442F] shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
