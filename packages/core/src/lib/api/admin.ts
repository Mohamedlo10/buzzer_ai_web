import { apiClient } from './client';
import type {
  AdminStatsResponse,
  AdminTimelineResponse,
  AdminTopStatsResponse,
  AdminSessionSummaryResponse,
  AdminSessionDetailResponse,
  AdminActiveSessionResponse,
  AdminRoomResponse,
  AdminRoomDetailResponse,
  AdminUserDetailResponse,
  AdminCategoryResponse,
  AdminQuestionResponse,
  AdminAuditLogResponse,
  AdminAdResponse,
  AdminAdRequest,
  Page,
  AdminDailyChallengeResponse,
  AdminDailyChallengeDetailResponse,
  DailyValidationReportResponse,
  AdminDailyQuestionResponse,
  CreateDailyChallengeRequest,
  UpdateDailyQuestionRequest,
} from '~/types/api';

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const res = await apiClient.get<AdminStatsResponse>('/api/admin/stats');
  return res.data;
}

export async function getAdminTimeline(period: string = '30d'): Promise<AdminTimelineResponse> {
  const res = await apiClient.get<AdminTimelineResponse>('/api/admin/stats/timeline', { params: { period } });
  return res.data;
}

export async function getAdminTopStats(): Promise<AdminTopStatsResponse> {
  const res = await apiClient.get<AdminTopStatsResponse>('/api/admin/stats/top');
  return res.data;
}

// ─── Sessions ──────────────────────────────────────────────────────────────

export interface SearchSessionsParams {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function getAdminSessions(params: SearchSessionsParams = {}) {
  const res = await apiClient.get<{ content: AdminSessionSummaryResponse[]; totalPages: number; number: number; totalElements: number }>(
    '/api/admin/sessions',
    { params }
  );
  return res.data;
}

export async function getAdminActiveSessions(): Promise<AdminActiveSessionResponse[]> {
  const res = await apiClient.get<AdminActiveSessionResponse[]>('/api/admin/sessions/active');
  return res.data;
}

export async function getAdminSessionDetail(sessionId: string): Promise<AdminSessionDetailResponse> {
  const res = await apiClient.get<AdminSessionDetailResponse>(`/api/admin/sessions/${sessionId}`);
  return res.data;
}

export async function forceStopSession(sessionId: string): Promise<void> {
  await apiClient.post(`/api/admin/sessions/${sessionId}/force-stop`);
}

// ─── Rooms ─────────────────────────────────────────────────────────────────

export interface SearchRoomsParams {
  search?: string;
  page?: number;
  size?: number;
}

export async function getAdminRooms(params: SearchRoomsParams = {}) {
  const res = await apiClient.get<{ content: AdminRoomResponse[]; totalPages: number; number: number; totalElements: number }>(
    '/api/admin/rooms',
    { params }
  );
  return res.data;
}

export async function getAdminRoomDetail(roomId: string): Promise<AdminRoomDetailResponse> {
  const res = await apiClient.get<AdminRoomDetailResponse>(`/api/admin/rooms/${roomId}`);
  return res.data;
}

export async function deleteAdminRoom(roomId: string): Promise<void> {
  await apiClient.delete(`/api/admin/rooms/${roomId}`);
}

export async function transferRoomOwnership(roomId: string, newOwnerId: string): Promise<void> {
  await apiClient.put(`/api/admin/rooms/${roomId}/transfer`, { newOwnerId });
}

// ─── Users ─────────────────────────────────────────────────────────────────

export interface SearchUsersParams {
  search?: string;
  page?: number;
  size?: number;
}

export async function getAdminUsers(params: SearchUsersParams = {}) {
  const res = await apiClient.get<{ content: any[]; totalPages: number; number: number; totalElements: number }>(
    '/api/admin/users',
    { params }
  );
  return res.data;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetailResponse> {
  const res = await apiClient.get<AdminUserDetailResponse>(`/api/admin/users/${userId}`);
  return res.data;
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await apiClient.put(`/api/admin/users/${userId}/role`, { role });
}

export async function banUser(userId: string, reason?: string): Promise<void> {
  await apiClient.put(`/api/admin/users/${userId}/ban`, { reason });
}

export async function unbanUser(userId: string): Promise<void> {
  await apiClient.put(`/api/admin/users/${userId}/unban`);
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}`);
}

// ─── Questions ─────────────────────────────────────────────────────────────

export interface SearchQuestionsParams {
  category?: string;
  search?: string;
  page?: number;
  size?: number;
}

export async function getAdminQuestionCategories(params: { search?: string; page?: number; size?: number } = {}) {
  const res = await apiClient.get<{ content: AdminCategoryResponse[]; totalPages: number; totalElements: number; number: number }>(
    '/api/admin/questions/categories',
    { params }
  );
  return res.data;
}

export async function getAdminQuestions(params: SearchQuestionsParams = {}) {
  const res = await apiClient.get<{ content: AdminQuestionResponse[]; totalPages: number; totalElements: number; number: number }>(
    '/api/admin/questions',
    { params }
  );
  return res.data;
}

export async function updateAdminQuestion(questionId: string, data: { text?: string; answer?: string; explanation?: string; difficulty?: string }): Promise<void> {
  await apiClient.put(`/api/admin/questions/${questionId}`, data);
}

export async function deleteAdminQuestion(questionId: string): Promise<void> {
  await apiClient.delete(`/api/admin/questions/${questionId}`);
}

// ─── Audit Logs ────────────────────────────────────────────────────────────

export interface SearchAuditParams {
  action?: string;
  adminId?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function getAdminAuditLogs(params: SearchAuditParams = {}) {
  const res = await apiClient.get<{ content: AdminAuditLogResponse[]; totalPages: number; number: number; totalElements: number }>(
    '/api/admin/audit-logs',
    { params }
  );
  return res.data;
}

// ─── Publicités ────────────────────────────────────────────────────────────

/** GET /api/admin/ads — liste toutes les publicités. */
export async function getAdminAds(): Promise<AdminAdResponse[]> {
  const res = await apiClient.get<AdminAdResponse[]>('/api/admin/ads');
  return res.data;
}

/** POST /api/admin/ads — crée une publicité. */
export async function createAdminAd(request: AdminAdRequest): Promise<AdminAdResponse> {
  const res = await apiClient.post<AdminAdResponse>('/api/admin/ads', request);
  return res.data;
}

/** PUT /api/admin/ads/{id} — met à jour une publicité. */
export async function updateAdminAd(id: string, request: AdminAdRequest): Promise<AdminAdResponse> {
  const res = await apiClient.put<AdminAdResponse>(`/api/admin/ads/${id}`, request);
  return res.data;
}

/** DELETE /api/admin/ads/{id} — supprime une publicité. */
export async function deleteAdminAd(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/ads/${id}`);
}

// ─── Défi du Jour ──────────────────────────────────────────────────────────
//
// Routes /api/admin/daily-challenges/**, réservées au SUPER_ADMIN par SecurityConfig.
// Contrat source : controller/AdminDailyChallengeController.java

export async function getAdminDailyChallenges(
  page = 0,
  size = 20,
): Promise<Page<AdminDailyChallengeResponse>> {
  const res = await apiClient.get<Page<AdminDailyChallengeResponse>>(
    '/api/admin/daily-challenges',
    { params: { page, size } },
  );
  return res.data;
}

export async function getAdminDailyChallenge(
  id: string,
): Promise<AdminDailyChallengeDetailResponse> {
  const res = await apiClient.get<AdminDailyChallengeDetailResponse>(
    `/api/admin/daily-challenges/${id}`,
  );
  return res.data;
}

export async function createAdminDailyChallenge(
  request: CreateDailyChallengeRequest,
): Promise<AdminDailyChallengeResponse> {
  const res = await apiClient.post<AdminDailyChallengeResponse>(
    '/api/admin/daily-challenges',
    request,
  );
  return res.data;
}

/**
 * Lance la génération IA. Répond 202 : le travail continue en arrière-plan, et
 * l'écran interroge le détail tant que le statut vaut GENERATING.
 */
export async function generateAdminDailyChallenge(id: string): Promise<void> {
  await apiClient.post(`/api/admin/daily-challenges/${id}/generate`);
}

export async function updateAdminDailyQuestion(
  challengeId: string,
  questionId: string,
  request: UpdateDailyQuestionRequest,
): Promise<AdminDailyQuestionResponse> {
  const res = await apiClient.put<AdminDailyQuestionResponse>(
    `/api/admin/daily-challenges/${challengeId}/questions/${questionId}`,
    request,
  );
  return res.data;
}

/** Relit sans publier : renvoie la liste complète de ce qui cloche. */
export async function validateAdminDailyChallenge(
  id: string,
): Promise<DailyValidationReportResponse> {
  const res = await apiClient.post<DailyValidationReportResponse>(
    `/api/admin/daily-challenges/${id}/validate`,
  );
  return res.data;
}

/**
 * Publie l'édition.
 *
 * Le serveur répond 422 avec le rapport de validation s'il reste une violation
 * bloquante : l'appelant doit traiter ce cas, ce n'est pas une erreur réseau.
 */
export async function publishAdminDailyChallenge(
  id: string,
): Promise<AdminDailyChallengeResponse> {
  const res = await apiClient.post<AdminDailyChallengeResponse>(
    `/api/admin/daily-challenges/${id}/publish`,
  );
  return res.data;
}

export async function cancelAdminDailyChallenge(id: string): Promise<void> {
  await apiClient.post(`/api/admin/daily-challenges/${id}/cancel`);
}

export async function deleteAdminDailyChallenge(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/daily-challenges/${id}`);
}
