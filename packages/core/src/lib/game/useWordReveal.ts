import { useState, useEffect } from 'react';
import { serverNow } from './clock';

export function useWordReveal(
  revealedWordCount: number,
  totalWordCount: number,
  wordRevealStartedAtEpochMs: number | null,
  wordRevealIntervalMs: number
): number {
  const [displayedCount, setDisplayedCount] = useState(revealedWordCount);

  useEffect(() => {
    // Si la lecture n'est pas en cours, on affiche ce que le serveur a validé.
    if (wordRevealStartedAtEpochMs === null) {
      setDisplayedCount(revealedWordCount);
      return;
    }

    const calculate = () => {
      const now = serverNow();
      const elapsed = Math.max(0, now - wordRevealStartedAtEpochMs);
      const advanced = Math.floor(elapsed / wordRevealIntervalMs);
      return Math.min(revealedWordCount + advanced, totalWordCount);
    };

    // Calcul initial
    const initial = calculate();
    setDisplayedCount(initial);

    // Si on a déjà tout affiché, pas besoin de timer.
    if (initial >= totalWordCount) return;

    // Calculer le délai avant le PROCHAIN mot pour caler le setInterval
    const now = serverNow();
    const elapsed = Math.max(0, now - wordRevealStartedAtEpochMs);
    const msUntilNextWord = wordRevealIntervalMs - (elapsed % wordRevealIntervalMs);

    let intervalId: NodeJS.Timeout;

    // Lancer un setTimeout pour se synchroniser exactement sur le prochain mot,
    // puis lancer le setInterval régulier.
    const timeoutId = setTimeout(() => {
      setDisplayedCount(calculate());
      
      intervalId = setInterval(() => {
        const next = calculate();
        setDisplayedCount(next);
        if (next >= totalWordCount) {
          clearInterval(intervalId);
        }
      }, wordRevealIntervalMs);
    }, msUntilNextWord);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [revealedWordCount, totalWordCount, wordRevealStartedAtEpochMs, wordRevealIntervalMs]);

  return displayedCount;
}
