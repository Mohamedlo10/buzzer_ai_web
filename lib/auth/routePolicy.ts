/**
 * POLITIQUE D'ACCÈS AUX ROUTES — fonction pure, sans React ni Next.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ────────────────────────────────────────────────────────────────────────────
 * La protection des routes vivait dans `middleware.ts`, qui n'existe QUE sur
 * Next.js. En React Native il n'y a pas de middleware : la règle doit vivre dans
 * du code applicatif portable. C'est ce fichier — aucune dépendance, testable
 * sans navigateur, et déplaçable tel quel vers `packages/core` en phase 2 pour
 * être partagé entre Expo Router et le web.
 *
 * Le composant qui l'applique (`components/providers/AuthGate.tsx`) ne fait que
 * traduire la décision en navigation. Toute la logique est ici.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CHANGEMENT DE DÉFAUT : INTERDIT SAUF MENTION CONTRAIRE
 * ────────────────────────────────────────────────────────────────────────────
 * `middleware.ts` fonctionnait à l'envers : tout était public, et une liste
 * `PROTECTED_PREFIXES` désignait les huit préfixes à protéger. Une route
 * oubliée dans cette liste était donc publique par accident — et il y en avait :
 *
 *   · `/notifications`        (aucun préfixe correspondant)
 *   · `/solo/game/[id]`       (`/solo` absent de la liste)
 *   · `/solo/results/[id]`    (idem)
 *
 * Ces trois-là n'étaient protégées ni par le middleware ni par `AuthGuard`
 * (qui n'est monté que dans `app/(tabs)/layout.tsx`, donc ne couvre ni
 * `/session`, ni `/profile`, ni `/solo/game`). L'API rejetait bien les requêtes,
 * mais l'écran s'affichait avant.
 *
 * La logique est inversée ici : tout est protégé, sauf ce qui est explicitement
 * listé comme public. Ajouter un écran sans y penser le rend sûr par défaut.
 */

/** Décision rendue à l'appelant. Volontairement sérialisable et testable. */
export type AccessDecision =
  | { action: 'allow' }
  | { action: 'redirect'; to: string; reason: string };

export interface AccessInput {
  /** Chemin sans query string ni hash. */
  pathname: string;
  isAuthenticated: boolean;
  /**
   * Reprend le `MAINTENANCE_MODE` codé en dur dans `middleware.ts:19`.
   * En phase 6 cette valeur viendra d'un endpoint public (`GET /api/health`),
   * pilotable depuis `app/admin/settings` — un drapeau compilé en dur oblige
   * aujourd'hui à redéployer pour couper le service.
   */
  maintenance?: boolean;
}

/**
 * Écrans atteignables sans être connecté.
 * Correspondance EXACTE — un segment supplémentaire ne passe pas.
 */
const PUBLIC_EXACT = new Set([
  // Redirecteur : il choisit lui-même entre /rooms, /login et /onboarding.
  '/',
  // Le middleware excluait déjà explicitement l'onboarding de sa redirection
  // « déjà connecté », il reste donc atteignable dans les deux états.
  '/onboarding',
  '/maintenance',
  // Parcours e-mail : atteints depuis un lien, par définition hors session.
  '/confirm-email',
  '/forgot-password',
  '/reset-password',
]);

/** Écrans publics et tous leurs sous-chemins. */
const PUBLIC_PREFIXES = [
  // Écrans de vérification interne (grille de tokens…). Aucune donnée.
  // NB : pas `/_dev/` — l'App Router traite tout dossier préfixé par `_` comme
  // un dossier privé et ne lui crée aucune route (404 silencieux).
  '/dev/',
];

/**
 * Écrans réservés aux visiteurs NON connectés.
 * Un utilisateur déjà authentifié y est renvoyé vers l'accueil applicatif.
 */
const AUTH_ONLY = new Set(['/login', '/register']);

/** Où atterrit un utilisateur authentifié qui n'a rien demandé de précis. */
export const HOME_ROUTE = '/rooms';
export const LOGIN_ROUTE = '/login';
export const MAINTENANCE_ROUTE = '/maintenance';

/**
 * Nom du paramètre qui mémorise la destination initiale.
 *
 * Sans lui, un lien profond reçu hors session est PERDU : `/join/room/ABC`
 * renvoie vers `/login`, et après connexion l'utilisateur arrive sur l'accueil
 * sans jamais rejoindre le salon. C'est supportable sur le web (on peut recoller
 * l'URL) et rédhibitoire sur mobile, où le scheme `buzzmaster://` est le seul
 * moyen d'entrer dans une partie depuis un partage ou un QR code.
 */
export const RETURN_TO_PARAM = 'returnTo';

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Empêche qu'un `returnTo` fabriqué serve de redirection ouverte.
 * Seuls les chemins internes d'un seul segment initial sont acceptés :
 * `//evil.com` et `https://evil.com` sont tous deux rejetés.
 */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  if (raw.includes('://')) return null;
  // Une cible publique ou auth-only ne mène nulle part d'utile après connexion.
  const path = raw.split('?')[0];
  if (isPublic(path) || AUTH_ONLY.has(path)) return null;
  return raw;
}

export function buildLoginRedirect(pathname: string, search = ''): string {
  const target = `${pathname}${search}`;
  if (!sanitizeReturnTo(target)) return LOGIN_ROUTE;
  return `${LOGIN_ROUTE}?${RETURN_TO_PARAM}=${encodeURIComponent(target)}`;
}

/**
 * Décide si `pathname` est atteignable dans l'état d'authentification donné.
 *
 * L'ordre des règles est significatif : la maintenance prime sur tout, sinon on
 * pourrait se retrouver à protéger l'écran qui annonce la coupure.
 */
export function decideAccess({ pathname, isAuthenticated, maintenance = false }: AccessInput): AccessDecision {
  if (maintenance) {
    return pathname === MAINTENANCE_ROUTE
      ? { action: 'allow' }
      : { action: 'redirect', to: MAINTENANCE_ROUTE, reason: 'maintenance' };
  }

  if (pathname === MAINTENANCE_ROUTE) {
    // Destination selon l'état, et non `/login` systématiquement comme le
    // faisait `middleware.ts` : un utilisateur connecté y était renvoyé vers
    // `/login`, qui le renvoyait aussitôt vers `/rooms`. Deux redirections pour
    // une, et un passage visible par l'écran de connexion.
    return {
      action: 'redirect',
      to: isAuthenticated ? HOME_ROUTE : LOGIN_ROUTE,
      reason: 'maintenance-off',
    };
  }

  if (AUTH_ONLY.has(pathname)) {
    return isAuthenticated
      ? { action: 'redirect', to: HOME_ROUTE, reason: 'already-authenticated' }
      : { action: 'allow' };
  }

  if (isPublic(pathname)) return { action: 'allow' };

  if (!isAuthenticated) {
    return { action: 'redirect', to: buildLoginRedirect(pathname), reason: 'unauthenticated' };
  }

  return { action: 'allow' };
}

/**
 * Le contrôle de RÔLE reste dans `app/admin/layout.tsx`, qui vérifie déjà
 * `user.role !== 'SUPER_ADMIN'`. Il n'est pas remonté ici volontairement : deux
 * redirections concurrentes sur le même rendu se marchent dessus. `/admin` est
 * simplement traité comme protégé — l'authentification est vérifiée ici, le rôle
 * une couche plus bas.
 *
 * En phase 2bis, `/admin` part vers `apps/admin` (Vite) et emportera son propre
 * garde ; cette note pourra disparaître.
 */
