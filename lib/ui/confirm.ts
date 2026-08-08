import { create } from 'zustand';

/**
 * Confirmation modale promisifiée — remplace les 17 `window.confirm()`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * LE VRAI PROBLÈME N'EST PAS LE NOM DE LA FONCTION
 * ────────────────────────────────────────────────────────────────────────────
 * `window.confirm()` est SYNCHRONE : il gèle le thread et renvoie un booléen,
 * ce qui permet d'écrire `if (window.confirm(...)) { ... }` en plein milieu d'un
 * flux. `Alert.alert` de React Native ne fait rien de tel — il affiche et
 * rappelle plus tard. Il n'existe donc aucune traduction ligne à ligne : chaque
 * site d'appel doit voir son FLUX DE CONTRÔLE retourné.
 *
 * C'est précisément le genre de refonte qu'il faut faire ici, en Next.js, où
 * l'on peut cliquer et vérifier en trente secondes — et surtout pas plus tard,
 * à l'aveugle sur un simulateur, au milieu du portage d'un écran.
 *
 * Après ce changement, la version native n'est plus qu'un module `.native.ts`
 * d'une vingtaine de lignes qui enveloppe `Alert.alert` : la signature
 * `confirmAsync(): Promise<boolean>` et les 17 sites d'appel ne bougent plus.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN STORE PLUTÔT QU'UN HOOK
 * ────────────────────────────────────────────────────────────────────────────
 * Une API impérative appelable depuis n'importe où — y compris hors composant
 * (stores Zustand, intercepteurs axios) — évite de faire redescendre un
 * `useConfirm()` à travers les arbres. Le composant hôte
 * (`components/providers/ConfirmHost.tsx`) se contente de lire cet état.
 */

export type ConfirmTone = 'default' | 'danger' | 'warning';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Intention, pas couleur. Les sites d'appel passaient auparavant des chaînes
   * CSS (`var(--bad)`), qui n'ont aucun sens en React Native — et qui étaient
   * de toute façon cassées, voir le commentaire de `ConfirmModal`.
   */
  tone?: ConfirmTone;
}

interface ConfirmState {
  pending: (ConfirmOptions & { id: number }) | null;
  resolve: ((value: boolean) => void) | null;
  open: (options: ConfirmOptions, resolve: (value: boolean) => void) => void;
  settle: (value: boolean) => void;
}

let nextId = 0;

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  pending: null,
  resolve: null,

  open: (options, resolve) => {
    // Une demande déjà à l'écran est refusée plutôt qu'écrasée : sans ça, la
    // promesse précédente ne se résoudrait jamais et le `await` de son appelant
    // resterait suspendu pour toujours.
    const previous = get().resolve;
    if (previous) previous(false);

    set({ pending: { ...options, id: ++nextId }, resolve });
  },

  settle: (value) => {
    const resolve = get().resolve;
    set({ pending: null, resolve: null });
    resolve?.(value);
  },
}));

/**
 * Demande confirmation et rend la main quand l'utilisateur a tranché.
 *
 *   if (!(await confirmAsync({ title: 'Supprimer ?', message: '…', tone: 'danger' }))) return;
 *
 * Résout `false` sur annulation, sur clic hors de la boîte, et si une autre
 * demande vient la remplacer.
 */
export function confirmAsync(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    useConfirmStore.getState().open(options, resolve);
  });
}
