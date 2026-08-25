'use client';

import { useEffect, useState } from 'react';
import { msUntil } from './clock';

/**
 * Décompte piloté par une échéance serveur absolue.
 *
 * Remplace les `setInterval` qui décrémentaient un compteur local. Ceux-ci
 * avaient deux défauts : ils repartaient de zéro dès qu'une prop changeait
 * d'identité (ce qui réarmait aussi le garde anti-double-soumission), et ils
 * dérivaient — un onglet en arrière-plan voit ses timers throttlés, si bien que
 * le chrono affiché finissait par mentir.
 *
 * Ici il n'y a pas d'état à conserver : à chaque tick on relit l'écart avec
 * l'échéance. Un onglet réveillé après une mise en veille affiche donc
 * immédiatement la bonne valeur.
 *
 * @param deadlineEpochMs échéance en temps serveur, ou null si aucune
 * @returns secondes restantes, arrondies au supérieur, jamais négatives
 */
export function useDeadlineSeconds(deadlineEpochMs: number | null | undefined): number {
  const [remainingMs, setRemainingMs] = useState(() => msUntil(deadlineEpochMs));

  useEffect(() => {
    if (!deadlineEpochMs) {
      setRemainingMs(0);
      return;
    }

    setRemainingMs(msUntil(deadlineEpochMs));

    // 200 ms : assez fin pour que la seconde affichée change au bon moment,
    // assez grossier pour rester négligeable en coût.
    const interval = setInterval(() => {
      const next = msUntil(deadlineEpochMs);
      setRemainingMs(next);
      if (next <= 0) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [deadlineEpochMs]);

  // Synchronous fallback so initial render with a new deadline never sees 0
  const effectiveMs = deadlineEpochMs ? msUntil(deadlineEpochMs) : remainingMs;

  return Math.ceil(effectiveMs / 1000);
}
