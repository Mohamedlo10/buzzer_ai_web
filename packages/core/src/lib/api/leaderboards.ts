/**
 * Classements du jour, de la semaine et de la saison.
 *
 * Calqué sur `rankings.ts`. Distinct de lui : `/api/rankings/global` sert le classement
 * global cumulé, adossé à Glicko-2 et à ses propres requêtes. Les deux systèmes ont des
 * objectifs différents et ne se mélangent pas (§32).
 */
import { apiClient } from './client';
import type {
  LeaderboardEntryResponse,
  LeaderboardPageResponse,
  LeaderboardPeriodType,
} from '~/types/leaderboards';

export interface GetLeaderboardParams {
  period: LeaderboardPeriodType;
  username?: string;
  page?: number;
  size?: number;
}

export async function getLeaderboard(
  params: GetLeaderboardParams,
): Promise<LeaderboardPageResponse> {
  const res = await apiClient.get<LeaderboardPageResponse>('/api/leaderboards', { params });
  return res.data;
}

/**
 * Ma position seule, sans la liste — pour l'accueil et le profil.
 *
 * Le serveur répond 204 si je n'ai pas encore joué sur cette période : un état vide
 * légitime, pas une erreur. On le traduit en `null`.
 */
export async function getMyPosition(
  period: LeaderboardPeriodType,
): Promise<LeaderboardEntryResponse | null> {
  const res = await apiClient.get<LeaderboardEntryResponse>('/api/leaderboards/me', {
    params: { period },
  });
  return res.status === 204 ? null : res.data;
}
