'use client';

interface ProgressiveQuestionDisplayProps {
  text: string;
  wordIndex: number;
  isRunning: boolean;
}

export function ProgressiveQuestionDisplay({
  text,
  wordIndex,
  isRunning,
}: ProgressiveQuestionDisplayProps) {
  const words = text.split(' ');
  const isFullyRevealed = wordIndex >= words.length - 1;
  const revealedText = words.slice(0, wordIndex + 1).join(' ');

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
