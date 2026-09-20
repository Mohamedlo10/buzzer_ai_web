/**
 * RETOUR DE GOOGLE SUR LE WEB — fonction pure, sans React ni navigateur.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ────────────────────────────────────────────────────────────────────────────
 * `expo-auth-session` ouvre Google dans une fenêtre fille, et c'est elle qui reçoit la réponse
 * sur `https://<origine>/#state=…&id_token=…`. Cette fenêtre doit appeler
 * `WebBrowser.maybeCompleteAuthSession()`, qui renvoie l'URL à l'onglet d'origine — lequel attend
 * dans `promptAsync()` puis referme la fenêtre.
 *
 * Cet appel vivait au niveau module de `native/auth/googleAuth.ts`, chargé uniquement par l'écran
 * de connexion. Or Expo Router n'évalue le module d'une route qu'au rendu de cette route : sur `/`
 * seuls le layout racine et `index.tsx` le sont. Personne n'appelait donc
 * `maybeCompleteAuthSession()` : la fenêtre démarrait l'application, n'y trouvait aucune session,
 * effaçait le drapeau d'onboarding et affichait l'accueil — pendant que l'onglet d'origine
 * attendait un message qui ne venait jamais.
 *
 * Trois situations se présentent au retour, et elles n'appellent pas la même réaction :
 *   1. fenêtre fille (cas nominal)          → rendre la main à l'onglet d'origine ;
 *   2. redirection de l'onglet principal    → consommer le token sur place ;
 *   3. fragment sans `id_token`             → arrivée ordinaire, ne rien faire.
 *
 * Le cas 2 arrive dans les navigateurs in-app (Instagram, Facebook, TikTok), qui redirigent la
 * page courante au lieu d'ouvrir une fenêtre. Sans lui, ces utilisateurs n'ont aucun moyen de se
 * connecter avec Google.
 *
 * La décision est isolée ici pour être testable sans DOM. Les effets de bord correspondants
 * (`maybeCompleteAuthSession`, `localStorage`, `history.replaceState`) vivent dans
 * `apps/game/native/auth/webGoogleRedirect.ts`.
 */

export type GoogleRedirectMode =
  /** Arrivée ordinaire : rien à traiter. */
  | 'none'
  /** Fenêtre fille : le token repart vers l'onglet d'origine. */
  | 'handoff'
  /** Redirection de l'onglet principal : à nous de consommer le token. */
  | 'token';

export interface GoogleRedirectInput {
  /** Fragment de l'URL d'arrivée, avec ou sans le `#` initial. */
  hash: string;
  /**
   * La page a-t-elle été ouverte par `promptAsync()` ? Se lit sur `window.opener`, jamais sur le
   * code retour de `maybeCompleteAuthSession()` : faute d'`opener`, celui-ci retombe sur
   * `window.parent` — qui vaut `window` — se poste le message à lui-même et répond `success`.
   */
  hasOpener: boolean;
  /** `state` de la demande partie d'ici, déposé avant d'ouvrir Google. */
  expectedState: string | null;
}

export interface GoogleRedirectDecision {
  mode: GoogleRedirectMode;
  /** Token à consommer (mode `token`) ou à garder en secours (mode `handoff`). */
  idToken: string | null;
  /** Un `id_token` figure dans l'URL : il ne doit y rester ni dans l'historique. */
  shouldStripHash: boolean;
}

const NOTHING_TO_DO: GoogleRedirectDecision = {
  mode: 'none',
  idToken: null,
  shouldStripHash: false,
};

export function decideGoogleRedirect({
  hash,
  hasOpener,
  expectedState,
}: GoogleRedirectInput): GoogleRedirectDecision {
  if (!hash || !hash.includes('id_token=')) return NOTHING_TO_DO;

  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const idToken = params.get('id_token');
  const state = params.get('state');

  // Le `state` prouve que cette réponse répond à une demande partie d'ici. Sans cette
  // vérification, n'importe quel lien pourrait nous faire ouvrir la session d'un autre compte.
  const answersOurRequest = !!state && !!expectedState && state === expectedState;
  const usableToken = idToken && answersOurRequest ? idToken : null;

  if (hasOpener) {
    // L'onglet d'origine vérifie lui-même le `state` (`AuthRequest.parseReturnUrl`) : ici le
    // token n'est retenu que comme secours, si jamais il ne referme pas cette fenêtre.
    return { mode: 'handoff', idToken: usableToken, shouldStripHash: true };
  }

  return {
    mode: usableToken ? 'token' : 'none',
    idToken: usableToken,
    shouldStripHash: true,
  };
}
