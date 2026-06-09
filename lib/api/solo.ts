import { apiClient, apiClientLongTimeout } from './client';
import type {
  SoloCareerProgressResponse,
  SoloSessionStartResponse,
  SoloTrainingPlanResponse,
  SoloAnswerRevealResponse,
  SoloNextQuestionResponse,
  SoloSessionResultResponse,
} from '~/types/solo';

// ──────────────────────────────────────────────
// Careers
// ──────────────────────────────────────────────

export async function createCareer(category: string): Promise<SoloCareerProgressResponse> {
  const res = await apiClient.post<SoloCareerProgressResponse>('/api/solo/careers', { category });
  return res.data;
}

export async function listCareers(): Promise<SoloCareerProgressResponse[]> {
  const res = await apiClient.get<SoloCareerProgressResponse[]>('/api/solo/careers');
  return res.data;
}

export async function getCareer(careerId: string): Promise<SoloCareerProgressResponse> {
  const res = await apiClient.get<SoloCareerProgressResponse>(`/api/solo/careers/${careerId}`);
  return res.data;
}

export async function startLevel(careerId: string, levelNumber: number): Promise<SoloSessionStartResponse> {
  const res = await apiClient.post<SoloSessionStartResponse>(
    `/api/solo/careers/${careerId}/levels/${levelNumber}/start`
  );
  return res.data;
}

export async function abandonCareer(careerId: string): Promise<void> {
  await apiClient.delete(`/api/solo/careers/${careerId}`);
}

// ──────────────────────────────────────────────
// Training
// ──────────────────────────────────────────────

export async function createCustomTraining(
  theme: string,
  difficulty: string
): Promise<SoloTrainingPlanResponse> {
  // Use apiClientLongTimeout since AI question generation can take 15-30s
  const res = await apiClientLongTimeout.post<SoloTrainingPlanResponse>('/api/solo/training/custom', {
    theme,
    difficulty,
  });
  return res.data;
}

export async function listCustomTrainings(): Promise<SoloTrainingPlanResponse[]> {
  const res = await apiClient.get<SoloTrainingPlanResponse[]>('/api/solo/training/custom');
  return res.data;
}

export async function listPredefinedTrainings(): Promise<SoloTrainingPlanResponse[]> {
  const res = await apiClient.get<SoloTrainingPlanResponse[]>('/api/solo/training/predefined');
  return res.data;
}

export async function getTrainingPlan(planId: string): Promise<SoloTrainingPlanResponse> {
  const res = await apiClient.get<SoloTrainingPlanResponse>(`/api/solo/training/${planId}`);
  return res.data;
}

export async function startTrainingLevel(
  planId: string,
  subLevel: number
): Promise<SoloSessionStartResponse> {
  const res = await apiClient.post<SoloSessionStartResponse>(
    `/api/solo/training/${planId}/levels/${subLevel}/start`
  );
  return res.data;
}

export interface VoteRegenerationResponse {
  voteCount: number;
  votesNeeded: number;
  regenerationTriggered: boolean;
}

export async function voteRegeneration(planId: string): Promise<VoteRegenerationResponse> {
  const res = await apiClient.post<VoteRegenerationResponse>(`/api/solo/training/${planId}/vote-regeneration`);
  return res.data;
}

// ──────────────────────────────────────────────
// Sessions (Gameplay loop)
// ──────────────────────────────────────────────

export async function resumeSession(sessionId: string): Promise<SoloSessionStartResponse> {
  const res = await apiClient.get<SoloSessionStartResponse>(`/api/solo/sessions/${sessionId}/resume`);
  return res.data;
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
  timeSpentMs: number
): Promise<SoloAnswerRevealResponse> {
  const res = await apiClient.post<SoloAnswerRevealResponse>(`/api/solo/sessions/${sessionId}/answer`, {
    questionId,
    answer,
    timeSpentMs,
  });
  return res.data;
}

export async function nextQuestion(sessionId: string): Promise<SoloNextQuestionResponse> {
  const res = await apiClient.post<SoloNextQuestionResponse>(`/api/solo/sessions/${sessionId}/next`);
  return res.data;
}

export async function getResults(sessionId: string): Promise<SoloSessionResultResponse> {
  const res = await apiClient.get<SoloSessionResultResponse>(`/api/solo/sessions/${sessionId}/results`);
  return res.data;
}
