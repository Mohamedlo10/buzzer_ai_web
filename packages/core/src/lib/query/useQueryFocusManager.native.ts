import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * Branche le `focusManager` de react-query sur `AppState` — implémentation iOS / Android.
 *
 * <p><b>Ce que ce fichier répare.</b> `queryClient.ts` porte `refetchOnWindowFocus: true` depuis
 * l'origine, et cette option n'a jamais rien fait : react-query n'installe un écouteur de focus
 * que sur le web, où il existe un `document`. Sur React Native, aucun événement de focus ne
 * parvient donc au `focusManager`, et l'option reste posée mais inerte. Conséquence observée :
 * un joueur devait fermer et rouvrir l'application pour voir un défi fraîchement publié.
 *
 * <p>Une fois câblé, toute requête périmée se recharge au retour au premier plan — pour
 * l'ensemble de l'application, et non pour un écran en particulier. Le `staleTime` de 30 s par
 * défaut borne la dépense : une requête fraîche n'est pas rejouée.
 *
 * <p>Le `focusManager` est un singleton de react-query, pas un état de composant : on l'installe
 * une seule fois, à la racine. Le nettoyage retire l'abonnement `AppState`, sans quoi un
 * rechargement à chaud en développement empilerait les écouteurs.
 *
 * <p>Même découpage par plateforme que {@code useAppStateReconnect}, qui résout exactement le
 * même problème pour le WebSocket.
 */
export function useQueryFocusManager() {
  useEffect(() => {
    return focusManager.setEventListener((handleFocus) => {
      const subscription = AppState.addEventListener(
        'change',
        (state: AppStateStatus) => {
          // `inactive` couvre la bascule d'application sur iOS : on ne considère « au premier
          // plan » que l'état actif franc, sinon un simple glissement du centre de contrôle
          // déclencherait un rechargement complet.
          handleFocus(state === 'active');
        },
      );

      return () => subscription.remove();
    });
  }, []);
}
