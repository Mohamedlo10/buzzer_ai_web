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
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!deadlineEpochMs) return;

    // 200 ms : assez fin pour que la seconde affichée change au bon moment,
    // assez grossier pour rester négligeable en coût.
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 200);

    return () => clearInterval(interval);
  }, [deadlineEpochMs]);

  if (!deadlineEpochMs) return 0;
  return Math.ceil(msUntil(deadlineEpochMs) / 1000);
}
