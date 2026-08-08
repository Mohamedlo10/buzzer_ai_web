import { RETURN_TO_PARAM, sanitizeReturnTo } from './routePolicy';

/**
 * Lit la destination mémorisée par `AuthGate` avant de renvoyer vers `/login`.
 *
 * ── Pourquoi pas `useSearchParams()` ──
 * Le hook de `next/navigation` impose un `<Suspense>` autour du composant qui
 * l'appelle dès que la page est rendue statiquement — ce qui obligerait à
 * découper `app/(auth)/login/page.tsx` (300+ lignes) pour un paramètre lu une
 * seule fois, au moment de la soumission. Une lecture ponctuelle suffit.
 *
 * ── Portage React Native ──
 * C'est l'implémentation WEB. En phase 3, ce module devient une paire
 * `.web.ts` / `.native.ts` (cf. la règle de décision web/natif du plan) : côté
 * natif la valeur vient de `useLocalSearchParams()` d'Expo Router, alimenté par
 * le lien profond `buzzmaster://`. La signature ne change pas, les sites
 * d'appel non plus.
 *
 * La validation reste dans `routePolicy.sanitizeReturnTo` — partagée, testée, et
 * seule responsable de refuser les redirections ouvertes.
 */
export function readReturnTo(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get(RETURN_TO_PARAM);
  return sanitizeReturnTo(raw);
}
