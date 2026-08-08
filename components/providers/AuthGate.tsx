'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '~/stores/useAuthStore';
import { decideAccess } from '~/lib/auth/routePolicy';

/**
 * Applique la politique d'accès de `lib/auth/routePolicy.ts`.
 *
 * Ce composant remplace fonctionnellement `middleware.ts` — qui n'existe pas en
 * React Native — et couvre en une seule fois TOUTES les routes, là où
 * `AuthGuard` n'était monté que dans `app/(tabs)/layout.tsx` et laissait
 * `/session`, `/profile`, `/solo/game` et `/notifications` sans garde client.
 *
 * Il est monté dans `AppProviders`, donc APRÈS que `restoreSession()` a été
 * attendue : `isAuthenticated` est déjà stabilisé au premier rendu et il n'y a
 * pas d'état « en cours de vérification » à gérer ici. C'est ce qui permet à ce
 * composant de rester aussi court.
 *
 * ── Ce qu'il ne fait pas ──
 * Le contrôle de rôle admin reste dans `app/admin/layout.tsx` (voir la note en
 * fin de `routePolicy.ts`). Tant que `middleware.ts` existe, les deux gardes
 * cohabitent : le middleware coupe côté serveur avant même le rendu, celui-ci
 * prend le relais et deviendra le seul en phase 2, quand le cookie
 * `has_session` disparaîtra.
 *
 * ── Rendu bloquant ──
 * On ne rend rien tant qu'une redirection est due. Rendre l'écran protégé « le
 * temps que le routeur bouge » provoque un flash de contenu privé et, pire, le
 * déclenchement des `useEffect` de la page — appels API, abonnements WebSocket —
 * pour un utilisateur qui n'y a pas droit.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const decision = decideAccess({ pathname: pathname ?? '/', isAuthenticated });

  useEffect(() => {
    if (decision.action === 'redirect') {
      router.replace(decision.to);
    }
    // `decision` est recalculée à chaque rendu ; on dépend de son contenu, pas
    // de son identité.
  }, [decision.action, decision.action === 'redirect' ? decision.to : null, router]);

  if (decision.action === 'redirect') return null;

  return <>{children}</>;
}
