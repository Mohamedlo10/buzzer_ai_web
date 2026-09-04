/**
 * Module API du Défi du Jour.
 *
 * Calqué sur rankings.ts : apiClient (30 s), jamais apiClientFast (3 s).
 * Raison : une soumission qui expire en 3 s sur un réseau mobile sénégalais
 * produit une question perdue. Ce n'est pas du temps réel multijoueur.
 *
 * Contrat serveur : DailyChallengeController.java
 */
import { apiClient } from './client';
import type {
  DailyTodayResponse,
  DailyAttemptStateResponse,
  DailyAnswerResultResponse,
  DailyAttemptResultResponse,
  SubmitDailyAnswerRequest,
} from '~/types/daily';
import type { Page, DailyHistoryEntryResponse, ProfileSummaryResponse } from '~/types/api';

/**
 * Tout ce dont la carte « Défi du Jour » a besoin, en un appel.
 * Toujours 200 — available: false si pas d'édition aujourd'hui.
 *
 * GET /api/daily/today
 */
export async function getToday(): Promise<DailyTodayResponse> {
  const res = await apiClient.get<DailyTodayResponse>('/api/daily/today');
  return res.data;
}

/**
 * Démarre la tentative du jour ou reprend celle en cours.
 * 201 → état de la tentative
 * 409 ALREADY_COMPLETED → tentative déjà terminée
 * 409 CHALLENGE_NOT_LIVE → édition non ouverte
 *
 * POST /api/daily/today/attempts
 */
export async function startAttempt(): Promise<DailyAttemptStateResponse> {
  const res = await apiClient.post<DailyAttemptStateResponse>('/api/daily/today/attempts');
  return res.data;
}

/**
 * Reprise après fermeture de l'application.
 * L'état vient du serveur, pas d'AsyncStorage.
 *
 * GET /api/daily/today/attempts/current
 */
export async function getCurrentAttempt(): Promise<DailyAttemptStateResponse> {
  const res = await apiClient.get<DailyAttemptStateResponse>(
    '/api/daily/today/attempts/current',
  );
  return res.data;
}

/**
 * Envoie une réponse et reçoit la question suivante dans la même réponse.
 * Aucun horodatage dans le corps — le temps est mesuré côté serveur.
 *
 * POST /api/daily/attempts/{attemptId}/answers
 */
export async function submitAnswer(
  attemptId: string,
  request: SubmitDailyAnswerRequest,
): Promise<DailyAnswerResultResponse> {
  const res = await apiClient.post<DailyAnswerResultResponse>(
    `/api/daily/attempts/${attemptId}/answers`,
    request,
  );
  return res.data;
}

/**
 * Résultat détaillé d'une tentative terminée.
 * Disponible dès que status === COMPLETED.
 *
 * GET /api/daily/attempts/{attemptId}/result
 */
export async function getAttemptResult(
  attemptId: string,
): Promise<DailyAttemptResultResponse> {
  const res = await apiClient.get<DailyAttemptResultResponse>(
    `/api/daily/attempts/${attemptId}/result`,
  );
  return res.data;
}
/**
 * Historique paginé des tentatives terminées (§24 — « MES PARTIES »).
 * Tri : plus récent en premier.
 *
 * GET /api/daily/history
 */
export async function getHistory(
  page = 0,
  size = 20,
): Promise<Page<DailyHistoryEntryResponse>> {
  const res = await apiClient.get<Page<DailyHistoryEntryResponse>>(
    '/api/daily/history',
    { params: { page, size } },
  );
  return res.data;
}

/**
 * Sept statistiques du profil V1 (§19), calculées serveur.
 * Zéros francs pour un compte neuf — jamais de valeurs inventées (§17).
 *
 * GET /api/daily/profile-summary
 */
export async function getProfileSummary(): Promise<ProfileSummaryResponse> {
  const res = await apiClient.get<ProfileSummaryResponse>('/api/daily/profile-summary');
  return res.data;
}
