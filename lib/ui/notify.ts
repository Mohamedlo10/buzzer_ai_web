import { toast } from 'sonner';

/**
 * Messages non bloquants — remplace les 37 `alert()` du projet.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI PASSER PAR UNE INDIRECTION
 * ────────────────────────────────────────────────────────────────────────────
 * `alert()` n'existe pas en React Native, et son remplaçant naturel
 * (`Alert.alert`) n'est pas une fonction bloquante : il ne rend pas la main, il
 * rappelle. Réécrire 37 sites d'appel au moment du portage, à l'aveugle sur
 * simulateur, serait bien plus coûteux que de les faire passer dès maintenant
 * par une API dont la signature ne changera pas.
 *
 * `notify.error(msg)` s'écrit pareil sur les trois plateformes. Seule
 * l'implémentation change : `sonner` ici, `react-native-toast-message` en
 * natif (module `.native.ts`, phase 3).
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI C'EST AUSSI UN GAIN IMMÉDIAT SUR LE WEB
 * ────────────────────────────────────────────────────────────────────────────
 * `alert()` gèle le thread principal. Dans un jeu de buzzer temps réel, cela
 * signifie que pendant qu'une boîte de dialogue attend un clic, les trames
 * WebSocket ne sont plus traitées et l'horloge de jeu dérive. Sur `window.alert`
 * en plein match — il y en avait 5 dans `ModeratedGame.tsx` — c'est un vrai
 * problème, pas une question de style.
 */

/** Durées calées sur la longueur des messages du projet. */
const DURATION = { error: 5000, success: 3000, info: 4000 } as const;

export const notify = {
  /** Échec d'une action. Le plus fréquent : « Impossible de… ». */
  error(message: string) {
    toast.error(message, { duration: DURATION.error });
  },

  /** Action réussie dont le résultat n'est pas visible à l'écran. */
  success(message: string) {
    toast.success(message, { duration: DURATION.success });
  },

  /** Information neutre. */
  info(message: string) {
    toast(message, { duration: DURATION.info });
  },
};

/**
 * Extrait un message lisible d'une erreur d'API.
 *
 * Le motif `err?.response?.data?.message ?? 'texte par défaut'` était recopié à
 * la main sur une dizaine de sites, avec des variantes (`err.message`,
 * `error.response.data.message`) qui ne couvraient pas les mêmes cas. Un
 * `catch (err: any)` avec accès en chaîne finit tôt ou tard par afficher
 * « undefined » à l'utilisateur.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err.trim()) return err;

  const e = err as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  } | null;

  const fromResponse = e?.response?.data?.message;
  if (typeof fromResponse === 'string' && fromResponse.trim()) return fromResponse;

  const fromError = e?.message;
  if (typeof fromError === 'string' && fromError.trim()) return fromError;

  return fallback;
}

/** Raccourci du couple le plus courant : attraper puis afficher. */
export function notifyApiError(err: unknown, fallback: string) {
  notify.error(apiErrorMessage(err, fallback));
}
