import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

/**
 * Journalisation centralisée des échecs de requête.
 *
 * Volontairement un log et rien d'autre : pas de toast automatique. C'est l'écran qui décide
 * comment présenter son erreur (via `<ErrorState>`), parce que lui seul sait si l'échec est
 * bloquant ou secondaire. Un toast global transformerait chaque refetch d'arrière-plan raté
 * en interruption visible.
 *
 * L'intérêt de ce hook est de faire disparaître la catégorie « erreur avalée sans trace » :
 * jusqu'ici un `useQuery` en échec ne laissait aucune trace exploitable.
 */
function logQueryFailure(scope: 'query' | 'mutation', error: unknown, key?: unknown) {
  const label = key ? `${scope} ${JSON.stringify(key)}` : scope;
  console.error(`[react-query] ${label} a échoué :`, error);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => logQueryFailure('query', error, query.queryKey),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      logQueryFailure('mutation', error, mutation.options.mutationKey),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s before data is considered stale
      gcTime: 5 * 60_000,       // 5min garbage collection
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
