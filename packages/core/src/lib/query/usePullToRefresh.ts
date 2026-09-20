import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Geste « tirer pour rafraîchir » commun aux onglets.
 *
 * <p><b>Toutes les requêtes actives, pas une liste par écran.</b> Chaque écran énumérait jusqu'ici
 * ce qu'il rechargeait, et oubliait les cartes qui portent leur propre requête : le Défi du Jour
 * ({@code QuizOfTheDayCard}) n'était rechargé ni sur Salons ni sur Solo, si bien qu'un défi
 * fraîchement publié n'apparaissait qu'au redémarrage de l'application. {@code type: 'active'}
 * couvre d'office tout ce qui est monté — y compris les autres onglets déjà visités, qui restent
 * montés.
 *
 * <p>Les requêtes désactivées ({@code enabled: false}, comme la tentative du défi pilotée par
 * {@code play.tsx}) sont écartées par react-query lui-même.
 *
 * <p>{@code extra} recharge ce que react-query ne connaît pas : un store zustand, une
 * vérification locale. {@code throwOnError} remonte l'échec à l'écran au lieu de l'avaler en
 * silence.
 */
export function usePullToRefresh(extra?: () => Promise<unknown> | void) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        queryClient.refetchQueries({ type: 'active' }, { throwOnError: true }),
        extra?.(),
      ]);
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, extra]);

  return { refreshing, onRefresh, error };
}
