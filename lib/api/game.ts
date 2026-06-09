import { apiClient, apiClientFast } from './client';
import type {
  BuzzResponse,
  GameStateResponse,
  ScoreCorrectionRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  ValidateRequest,
} from '~/types/api';

export async function buzz(
  sessionId: string,
  timestamp: number,
  isFullyDisplayed: boolean = false,
): Promise<BuzzResponse> {
  // N'envoyer isFullyDisplayed que quand true pour rester compatible avec
  // les anciens backends qui lisent Map<String, Long> (boolean false planterait).
  const payload: Record<string, unknown> = { timestampMs: timestamp };
  if (isFullyDisplayed) payload.isFullyDisplayed = true;
  const res = await apiClientFast.post<BuzzResponse>(
    `/api/games/${sessionId}/buzz`,
    payload,
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

export async function advanceAfterAllWrong(sessionId: string): Promise<void> {
  await apiClientFast.post(`/api/games/${sessionId}/advance-after-all-wrong`);
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

export async function submitAnswer(
  sessionId: string,
  data: SubmitAnswerRequest,
): Promise<SubmitAnswerResponse> {
  const res = await apiClientFast.post<SubmitAnswerResponse>(
    `/api/games/${sessionId}/submit-answer`,
    data,
  );
  return res.data;
}
