import { apiClient } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdData {
  id: string;
  title: string;
  imageUrl?: string | null;
  targetUrl: string;
  placement: string;
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

export type AdPlacement = 'HOME' | 'RESULT' | 'GENERATION' | 'PROFILE';

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
