import { apiClient } from './client';
import type { PartnerSummaryResponse } from '../../types/api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdData {
  id: string;
  title: string;
  /** @deprecated Remplacée par `partner.media`. Servie pour les clients antérieurs. */
  imageUrl?: string | null;
  targetUrl: string;
  placement: string;
  /**
   * Identité du partenaire : nom, logo, médias du carrousel, état du favori.
   *
   * Optionnel dans le type, non parce que le serveur peut l'omettre — il ne le fait plus —
   * mais parce qu'une réponse mise en cache par une version antérieure du client peut encore
   * en être dépourvue.
   */
  partner?: PartnerSummaryResponse | null;
}

/**
 * Contrat stable retourné par GET /api/ads.
 *
 * - `enabled=false` → aucune pub, `ad=null`. AdSlot retourne null.
 * - `enabled=true, ad=null` → activé globalement mais rien de disponible.
 * - `enabled=true, ad≠null` → afficher la pub.
 */
export interface AdResponse {
  enabled: boolean;
  ad: AdData | null;
}

// ─── API ────────────────────────────────────────────────────────────────────

export type AdPlacement =
  | 'HOME'
  | 'RESULT'
  | 'GENERATION'
  | 'PROFILE'
  | 'ROOMS'
  | 'FRIENDS';

/**
 * Récupère la publicité active pour un emplacement.
 * Silencieux en cas d'erreur réseau : retourne {enabled:false, ad:null}
 * pour ne jamais bloquer le rendu d'un écran à cause d'une pub absente.
 */
export async function fetchAd(placement: AdPlacement): Promise<AdResponse> {
  try {
    const res = await apiClient.get<AdResponse>('/api/ads', { params: { placement } });
    return res.data;
  } catch {
    // Une erreur publicitaire ne doit jamais planter l'écran.
    return { enabled: false, ad: null };
  }
}
