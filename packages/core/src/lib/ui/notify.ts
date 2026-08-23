export interface ToastHandler {
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
}

let activeHandler: ToastHandler = {
  error: (msg) => console.error('[Notify Error]', msg),
  success: (msg) => console.log('[Notify Success]', msg),
  info: (msg) => console.info('[Notify Info]', msg),
};

export function setNotifyHandler(handler: ToastHandler) {
  activeHandler = handler;
}

export const notify = {
  /** Échec d'une action. Le plus fréquent : « Impossible de… ». */
  error(message: string) {
    activeHandler.error(message);
  },

  /** Action réussie dont le résultat n'est pas visible à l'écran. */
  success(message: string) {
    activeHandler.success(message);
  },

  /** Information neutre. */
  info(message: string) {
    activeHandler.info(message);
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
