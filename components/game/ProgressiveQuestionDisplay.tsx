import { useState, useEffect } from 'react';

interface ProgressiveQuestionDisplayProps {
  text: string;
  wordIndex: number;
  isRunning: boolean;
  showRiskBadge?: boolean;
}

export function ProgressiveQuestionDisplay({
  text,
  wordIndex,
  isRunning,
  showRiskBadge = true,
}: ProgressiveQuestionDisplayProps) {
  const words = text.split(' ');
  const currentWord = words[wordIndex] || '';
  const [typedCharCount, setTypedCharCount] = useState(0);

  // Reset typed character count and animate typing when the active word changes
  useEffect(() => {
    setTypedCharCount(0);
    if (!currentWord) return;

    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += 1;
      setTypedCharCount(charIndex);
      if (charIndex >= currentWord.length) {
        clearInterval(interval);
      }
    }, 25); // 25ms per character creates a very smooth and reactive typing feel

    return () => clearInterval(interval);
  }, [wordIndex, currentWord]);

  const isFullyRevealed = wordIndex >= words.length - 1;
  
  // Assemble revealed text: all completed words fully visible + current word character-by-character
  const previousText = words.slice(0, wordIndex).join(' ');
  const currentTypedWord = currentWord.slice(0, typedCharCount);
  const revealedText = previousText
    ? `${previousText} ${currentTypedWord}`
    : currentTypedWord;

  return (
    <div className="bg-surface rounded-2xl border border-line p-[18px]">
      <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase mb-2.5">Question</p>
      <p className="text-txt text-[19px] leading-relaxed font-medium min-h-[5.25rem]">
        {revealedText}
        {!isFullyRevealed && isRunning && (
          <span
            className="inline-block w-[2px] h-[1.05em] bg-txt/50 ml-1 align-text-bottom animate-blink-cursor"
            aria-hidden
          />
        )}
      </p>
      {showRiskBadge && !isFullyRevealed && isRunning && (
        <div className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full bg-energy/15 border border-energy/30">
          <span className="text-energy text-[11px] font-semibold">⚡ Lecture en cours — buzz risqué</span>
        </div>
      )}
    </div>
  );
}
