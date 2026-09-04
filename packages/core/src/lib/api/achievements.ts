/**
 * Module API des accomplissements (badges).
 *
 * Calqué sur rankings.ts : apiClient (30 s).
 * Aucune route ne débloque rien : les badges s'obtiennent uniquement par
 * évaluation serveur à la finalisation d'une tentative.
 *
 * Contrat serveur : controller/AchievementController.java
 */
import { apiClient } from './client';
import type { AchievementResponse } from '~/types/api';

/**
 * Catalogue complet, verrouillés inclus.
 * La grille du profil montre ce qui reste à obtenir — c'est ce qui donne
 * envie de revenir (§20).
 *
 * GET /api/achievements
 */
export async function getCatalog(): Promise<AchievementResponse[]> {
  const res = await apiClient.get<AchievementResponse[]>('/api/achievements');
  return res.data;
}

/**
 * Mes badges seuls, du plus récent au plus ancien.
 *
 * GET /api/achievements/me
 */
export async function getMine(): Promise<AchievementResponse[]> {
  const res = await apiClient.get<AchievementResponse[]>('/api/achievements/me');
  return res.data;
}

/**
 * Badges débloqués dont la modale n'a pas encore été vue.
 * Filet de rattrapage si l'application a été fermée entre le déblocage et
 * l'affichage de la modale.
 *
 * GET /api/achievements/me/unseen
 */
export async function getUnseen(): Promise<AchievementResponse[]> {
  const res = await apiClient.get<AchievementResponse[]>('/api/achievements/me/unseen');
  return res.data;
}

/**
 * Accuse réception des modales affichées.
 * ids : liste de userAchievementId (UUID), pas d'achievementId.
 *
 * POST /api/achievements/me/seen
 */
export async function markSeen(ids: string[]): Promise<void> {
  await apiClient.post('/api/achievements/me/seen', { ids });
}
