import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  decideGoogleRedirect,
  type GoogleRedirectMode,
} from '~/lib/auth/googleWebRedirect';

/**
 * Effets de bord du retour de Google sur le web : lecture du fragment, handshake avec l'onglet
 * d'origine, nettoyage de l'URL. La décision elle-même vit dans `~/lib/auth/googleWebRedirect`,
 * qui explique le cheminement complet et pourquoi ce module doit être importé par le layout
 * racine — donc évalué quelle que soit la route d'arrivée.
 *
 * Sur natif, tout est inerte : le flux Google y passe par le navigateur système.
 */

/** `state` de la demande en cours, posé avant d'ouvrir Google et relu au retour. */
const STATE_KEY = 'xalaat_google_auth_state';

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

let mode: GoogleRedirectMode = 'none';
let pendingIdToken: string | null = null;
/** Conservé pour le repli de `promoteHandoffToToken()`. */
let handoffIdToken: string | null = null;

function readStoredState(): string | null {
  try {
    return window.localStorage.getItem(STATE_KEY);
  } catch {
    return null;
  }
}

function forgetStoredState(): void {
  try {
    window.localStorage.removeItem(STATE_KEY);
  } catch {
    // localStorage indisponible (mode privé, cookies bloqués) : rien à nettoyer.
  }
}

/**
 * Mémorise le `state` de la demande en cours. Appelé par `googleAuth.ts` juste avant
 * `promptAsync()` : c'est lui qui permet, au retour, de refuser un `id_token` qui ne répondrait
 * pas à une connexion lancée par l'utilisateur.
 */
export function rememberGoogleAuthState(state: string | null | undefined): void {
  if (!isWeb || !state) return;
  try {
    window.localStorage.setItem(STATE_KEY, state);
  } catch {
    // Sans stockage, seul le repli « onglet principal » est perdu : le parcours nominal par
    // fenêtre fille n'a pas besoin de ce dépôt, `expo-auth-session` garde le sien en mémoire.
  }
}

if (isWeb) {
  const decision = decideGoogleRedirect({
    hash: window.location.hash,
    hasOpener: !!window.opener && window.opener !== window,
    expectedState: readStoredState(),
  });

  mode = decision.mode;

  if (decision.mode === 'handoff') {
    // Poste l'URL à l'onglet d'origine, qui referme ensuite cette fenêtre.
    try {
      WebBrowser.maybeCompleteAuthSession();
    } catch {
      // Handshake impossible : `promoteHandoffToToken()` prendra le relais.
    }
    handoffIdToken = decision.idToken;
  } else if (decision.mode === 'token') {
    pendingIdToken = decision.idToken;
    forgetStoredState();
  }

  if (decision.shouldStripHash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

export function getWebGoogleRedirectMode(): GoogleRedirectMode {
  return mode;
}

/**
 * Repli quand l'onglet d'origine ne referme pas la fenêtre fille — il a pu être rechargé entre
 * temps, et son écouteur `postMessage` a disparu avec lui. On reprend alors le token ici plutôt
 * que de laisser l'utilisateur devant un écran figé.
 */
export function promoteHandoffToToken(): GoogleRedirectMode {
  if (mode !== 'handoff') return mode;

  pendingIdToken = handoffIdToken;
  handoffIdToken = null;
  mode = pendingIdToken ? 'token' : 'none';
  forgetStoredState();
  return mode;
}

/** Lecture non destructive : sûre avec le double rendu de React StrictMode. */
export function getPendingGoogleIdToken(): string | null {
  return pendingIdToken;
}

export function clearPendingGoogleIdToken(): void {
  pendingIdToken = null;
  if (mode === 'token') mode = 'none';
}
