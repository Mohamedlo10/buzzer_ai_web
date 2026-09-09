/**
 * Variante web — délibérément vide.
 *
 * <p>react-query installe lui-même son écouteur de focus sur le web, à partir des événements
 * `visibilitychange` et `focus` du document. `refetchOnWindowFocus: true` y fonctionne donc déjà,
 * et poser un second écouteur ne ferait que doubler les rechargements.
 *
 * <p>Le fichier existe pour que l'appel dans `_layout.tsx` reste identique sur les deux
 * plateformes : c'est la résolution d'extension `.native.ts` de Metro qui choisit, pas une
 * condition à l'exécution. Même convention que {@code useAppStateReconnect}.
 */
export function useQueryFocusManager() {
  // Rien à faire : voir ci-dessus.
}
