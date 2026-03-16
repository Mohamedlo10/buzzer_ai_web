import { apiClient, apiClientFast } from './client';
import type {
  BuzzResponse,
  GameStateResponse,
  ScoreCorrectionRequest,
  ValidateRequest,
} from '~/types/api';

export async function buzz(
  sessionId: string,
  timestamp: number,
): Promise<BuzzResponse> {
  const res = await apiClientFast.post<BuzzResponse>(
    `/api/games/${sessionId}/buzz`,
    { timestamp },
  );
  return res.data;
}

export async function validateAnswer(
  sessionId: string,
  data: ValidateRequest,
): Promise<void> {
  await apiClientFast.post(`/api/games/${sessionId}/validate`, data);
}

export async function skipQuestion(sessionId: string): Promise<void> {
  await apiClientFast.post(`/api/games/${sessionId}/skip`);
}

export async function resetBuzzer(sessionId: string): Promise<void> {
  await apiClientFast.post(`/api/games/${sessionId}/reset-buzzer`);
}

export async function scoreCorrection(
  sessionId: string,
  data: ScoreCorrectionRequest,
): Promise<void> {
  await apiClientFast.post(`/api/games/${sessionId}/score-correction`, data);
}

export async function getGameState(sessionId: string): Promise<GameStateResponse> {
  const res = await apiClient.get<GameStateResponse>(
    `/api/games/${sessionId}/state`,
  );
  return res.data;
}
