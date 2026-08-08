import { NextRequest, NextResponse } from 'next/server';

import { decideAccess } from '~/lib/auth/routePolicy';

/**
 * Pré-filtre serveur — il ne décide de RIEN par lui-même.
 *
 * La politique d'accès vit dans `lib/auth/routePolicy.ts`, partagée avec
 * `components/providers/AuthGate.tsx`. Ce fichier ne fait que l'appliquer une
 * première fois côté Edge, avant tout rendu.
 *
 * ── Pourquoi déléguer plutôt que dupliquer ──
 * Ce middleware portait sa propre liste `PROTECTED_PREFIXES` de huit préfixes,
 * indépendante du garde client. Elle avait déjà divergé : `/notifications`,
 * `/solo/game/[id]` et `/solo/results/[id]` n'y figuraient pas, et n'étaient
 * couvertes par aucun des deux gardes. Deux jeux de règles pour une seule
 * question finissent toujours par se contredire.
 *
 * `decideAccess` est une fonction pure, sans dépendance navigateur : elle
 * s'exécute telle quelle dans le runtime Edge.
 *
 * ── Ce que ce fichier devient ──
 * Il disparaît en phase 2, en même temps que le cookie `has_session` : React
 * Native n'a pas de middleware, et `AuthGate` applique déjà exactement la même
 * décision côté client. D'ici là il reste utile — il coupe avant le rendu, donc
 * sans flash de contenu privé ni déclenchement des effets de la page (appels
 * API, abonnements WebSocket) pour un visiteur qui n'y a pas droit.
 *
 * ── Le signal d'authentification est faible, et c'est assumé ──
 * `has_session` est un simple drapeau posé en JavaScript par le client
 * (`lib/utils/storage.ts`), jamais par le serveur : il ne contient pas le JWT et
 * n'est pas vérifiable ici. C'est une garde optimiste anti-flash, pas un
 * contrôle de sécurité — celui-ci est fait par le backend Spring, qui exige un
 * `Authorization: Bearer` sur chaque requête.
 */

/**
 * Coupure de service. À basculer à `true` pour rediriger tout le trafic vers
 * `/maintenance`.
 *
 * Codé en dur, donc toute coupure impose aujourd'hui un redéploiement. En phase
 * 6 cette valeur viendra d'un endpoint public (`GET /api/health`), pilotable
 * depuis `app/admin/settings` — il faut que ce soit fait AVANT le retrait de ce
 * fichier, sinon le mécanisme disparaît sans remplaçant.
 */
const MAINTENANCE_MODE = false;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const decision = decideAccess({
    pathname,
    isAuthenticated: request.cookies.get('has_session')?.value === '1',
    maintenance: MAINTENANCE_MODE,
  });

  if (decision.action === 'redirect') {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
