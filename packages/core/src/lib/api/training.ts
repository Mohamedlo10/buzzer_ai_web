import { apiClient, apiClientLongTimeout } from './client';
import type {
  TrainingSessionResponse,
  TrainingResultResponse,
  TrainingSubjectMastery,
  TrainingSessionSummary,
  TrainingDifficulty,
} from '~/types/training';

// ──────────────────────────────────────────────
// Training v2 — API Client
// ──────────────────────────────────────────────

/**
 * Créer une session d'entraînement.
 * Utilise le timeout long car la génération AI peut prendre 15-30s.
 */
export async function createSession(
  subject: string,
  difficulty: TrainingDifficulty,
  durationMinutes: number
): Promise<TrainingSessionResponse> {
  const res = await apiClientLongTimeout.post<TrainingSessionResponse>('/api/training/v2/sessions', {
    subject,
    difficulty,
    durationMinutes,
  });
  return res.data;
}

/** Récupérer l'état courant d'une session */
export async function getSession(sessionId: string): Promise<TrainingSessionResponse> {
  const res = await apiClient.get<TrainingSessionResponse>(`/api/training/v2/sessions/${sessionId}`);
  return res.data;
}

/** Avancer à l'étape suivante */
export async function advance(sessionId: string): Promise<TrainingSessionResponse> {
  const res = await apiClient.post<TrainingSessionResponse>(`/api/training/v2/sessions/${sessionId}/advance`);
  return res.data;
}

/** Soumettre une réponse au défi courant */
export async function submitAnswer(
  sessionId: string,
  answer: string,
  timeSpentMs?: number
): Promise<TrainingSessionResponse> {
  const res = await apiClient.post<TrainingSessionResponse>(`/api/training/v2/sessions/${sessionId}/answer`, {
    answer,
    timeSpentMs,
  });
  return res.data;
}

/** Récupérer le bilan final */
export async function getResult(sessionId: string): Promise<TrainingResultResponse> {
  const res = await apiClient.get<TrainingResultResponse>(`/api/training/v2/sessions/${sessionId}/result`);
  return res.data;
}

/** Lancer la session de rattrapage */
export async function startRemediation(sessionId: string): Promise<TrainingSessionResponse> {
  const res = await apiClient.post<TrainingSessionResponse>(`/api/training/v2/sessions/${sessionId}/remediation`);
  return res.data;
}

/** Score de maîtrise pour un sujet */
export async function getMastery(subject: string): Promise<TrainingSubjectMastery | null> {
  try {
    const res = await apiClient.get<TrainingSubjectMastery>('/api/training/v2/mastery', {
      params: { subject },
    });
    return res.data;
  } catch {
    return null;
  }
}

/** Historique des sujets étudiés */
export async function getHistory(): Promise<TrainingSubjectMastery[]> {
  const res = await apiClient.get<TrainingSubjectMastery[]>('/api/training/v2/history');
  return res.data;
}

/** Lister toutes les sessions d'entraînement créées par l'utilisateur */
export async function listSessions(): Promise<TrainingSessionSummary[]> {
  const res = await apiClient.get<TrainingSessionSummary[]>('/api/training/v2/sessions');
  return res.data;
}
