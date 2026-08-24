import type { SessionMode, CategorySelectionMode } from '~/types/api';

/**
 * Détermine la route cible après la création d'une session.
 *
 * Règle métier :
 * - Si le mode est WITHOUT_MODERATOR (Sprint) et que les catégories ne sont pas imposées par le manager,
 *   le créateur est un joueur qui DOIT choisir ses catégories -> /session/{code}/categories.
 * - Si le mode est WITH_MODERATOR (l'hôte arbitre) ou que les catégories sont MANAGER (imposées),
 *   l'hôte va directement au lobby -> /session/{code}/lobby.
 */
export function resolvePostCreationRoute({
  code,
  sessionMode,
  categorySelectionMode,
}: {
  code: string;
  sessionMode?: SessionMode;
  categorySelectionMode?: CategorySelectionMode | string;
}): string {
  if (sessionMode === 'WITHOUT_MODERATOR' && categorySelectionMode !== 'MANAGER') {
    return `/session/${code}/categories`;
  }
  return `/session/${code}/lobby`;
}

/**
 * Détermine la route cible lorsqu'un joueur rejoint une session.
 *
 * Règle métier :
 * - Si les catégories sont imposées par le manager (MANAGER), le joueur n'a pas à choisir
 *   et va directement au lobby -> /session/{code}/lobby.
 * - Sinon (PER_PLAYER ou par défaut), le joueur passe par l'écran de sélection des catégories
 *   -> /session/{code}/categories.
 */
export function resolveJoinRoute({
  code,
  sessionId,
  categorySelectionMode,
}: {
  code: string;
  sessionId?: string;
  categorySelectionMode?: CategorySelectionMode | string;
}): string {
  if (categorySelectionMode === 'MANAGER') {
    return `/session/${code}/lobby`;
  }
  const query = sessionId ? `?sessionId=${sessionId}` : '';
  return `/session/${code}/categories${query}`;
}
