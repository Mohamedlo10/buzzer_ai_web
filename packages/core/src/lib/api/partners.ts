import { apiClient } from './client';
import type {
  Page,
  PartnerDetailResponse,
  PartnerSummaryResponse,
} from '../../types/api';

/**
 * Annuaire des partenaires, fiches et favoris — côté joueur.
 *
 * Le serveur calcule `favorite` sur chaque ligne : le client n'a jamais à croiser l'annuaire
 * avec une liste de favoris pour savoir quoi colorer.
 */

/** Annuaire, filtré par nom si `query` est fourni. Ne renvoie que les partenaires actifs. */
export async function searchPartners(
  query?: string,
  page = 0,
  size = 20,
): Promise<Page<PartnerSummaryResponse>> {
  const res = await apiClient.get<Page<PartnerSummaryResponse>>('/api/partners', {
    params: { query: query || undefined, page, size },
  });
  return res.data;
}

export async function fetchFavoritePartners(
  page = 0,
  size = 20,
): Promise<Page<PartnerSummaryResponse>> {
  const res = await apiClient.get<Page<PartnerSummaryResponse>>('/api/partners/favorites', {
    params: { page, size },
  });
  return res.data;
}

export async function fetchPartner(id: string): Promise<PartnerDetailResponse> {
  const res = await apiClient.get<PartnerDetailResponse>(`/api/partners/${id}`);
  return res.data;
}

/**
 * Ajoute aux favoris.
 *
 * PUT et non POST : l'opération est idempotente côté serveur, garantie par la contrainte
 * d'unicité en base. Un double appui ne produit donc pas de 409 sur une action que
 * l'utilisateur perçoit déjà comme accomplie.
 */
export async function addPartnerFavorite(id: string): Promise<void> {
  await apiClient.put(`/api/partners/${id}/favorite`);
}

/** Retire des favoris. Idempotent également. */
export async function removePartnerFavorite(id: string): Promise<void> {
  await apiClient.delete(`/api/partners/${id}/favorite`);
}
