import { apiClient, apiClientLongTimeout } from './client';
import type {
  CategoryRequest,
  CreateSessionRequest,
  CreateSessionResponse,
  JoinCheckResponse,
  JoinSessionRequest,
  LastSession,
  ManualQuestion,
  Page,
  ParsedQuestionsResponse,
  SessionDetailResponse,
  TeamResponse,
} from '~/types/api';

export interface SearchSessionsParams {
  code?: string;
  page?: number;
  size?: number;
}

export async function searchSessions(params: SearchSessionsParams = {}): Promise<Page<LastSession>> {
  const res = await apiClient.get<Page<LastSession>>('/api/sessions', { params });
  return res.data;
}

export async function createSession(
  data: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const res = await apiClient.post<CreateSessionResponse>('/api/sessions', data);
  return res.data;
}

export async function joinCheck(code: string): Promise<JoinCheckResponse> {
  const res = await apiClient.get<JoinCheckResponse>(`/api/sessions/join/${code}`);
  return res.data;
}

export async function joinSession(
  sessionId: string,
  data: JoinSessionRequest,
): Promise<SessionDetailResponse> {
  const res = await apiClient.post<SessionDetailResponse>(
    `/api/sessions/${sessionId}/players`,
    data,
  );
  return res.data;
}

export async function getSession(sessionId: string): Promise<SessionDetailResponse> {
  const res = await apiClient.get<SessionDetailResponse>(`/api/sessions/${sessionId}`);
  return res.data;
}

// Get session by code without LOBBY restriction (for rejoining active sessions)
export async function getSessionByCode(code: string): Promise<SessionDetailResponse> {
  const res = await apiClient.get<SessionDetailResponse>(`/api/sessions/code/${code}`);
  return res.data;
}

export async function startSession(sessionId: string): Promise<void> {
  // Utilise le client avec timeout étendu pour la génération AI
  await apiClientLongTimeout.post(`/api/sessions/${sessionId}/start`);
}

export async function pauseSession(sessionId: string): Promise<void> {
  await apiClient.post(`/api/sessions/${sessionId}/pause`);
}

export async function resumeSession(sessionId: string): Promise<void> {
  await apiClient.post(`/api/sessions/${sessionId}/resume`);
}

export async function removePlayer(
  sessionId: string,
  playerId: string,
): Promise<void> {
  await apiClient.delete(`/api/sessions/${sessionId}/players/${playerId}`);
}

export async function updatePlayerCategories(
  sessionId: string,
  playerId: string,
  categories: CategoryRequest[],
): Promise<void> {
  await apiClient.put(
    `/api/sessions/${sessionId}/players/${playerId}/categories`,
    categories,
  );
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/api/sessions/${sessionId}`);
}

export async function getTeams(sessionId: string): Promise<TeamResponse[]> {
  const res = await apiClient.get<TeamResponse[]>(`/api/sessions/${sessionId}/teams`);
  return res.data;
}

export async function changePlayerTeam(
  sessionId: string,
  playerId: string,
  teamId: string | null,
): Promise<void> {
  await apiClient.put(`/api/sessions/${sessionId}/players/${playerId}/team`, { teamId });
}

export async function updateSessionConfig(
  sessionId: string,
  data: { questionsPerCategory?: number },
): Promise<void> {
  await apiClient.patch(`/api/sessions/${sessionId}`, data);
}

export async function cancelGeneration(sessionId: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(`/api/sessions/${sessionId}/cancel-generation`);
  return res.data;
}

export async function getManualQuestions(sessionId: string): Promise<ManualQuestion[]> {
  const res = await apiClient.get<{ questions: ManualQuestion[] }>(
    `/api/sessions/${sessionId}/questions`,
  );
  return res.data.questions;
}

export async function setManualQuestions(
  sessionId: string,
  questions: ManualQuestion[],
): Promise<{ message: string }> {
  const res = await apiClient.put<{ message: string }>(
    `/api/sessions/${sessionId}/questions`,
    { questions },
  );
  return res.data;
}

export async function importQuestionsFromText(
  text: string,
): Promise<ParsedQuestionsResponse> {
  const res = await apiClient.post<ParsedQuestionsResponse>(
    '/api/questions/import/text',
    { text },
  );
  return res.data;
}

export async function getImportTemplate(): Promise<Blob> {
  const res = await apiClient.get('/api/questions/import/template', {
    responseType: 'blob',
  });
  return res.data;
}

type ExcelUploadFile =
  | File
  | {
      uri: string;
      name: string;
      type?: string | null;
    };

export async function importExcel(file: ExcelUploadFile): Promise<ParsedQuestionsResponse> {
  const formData = new FormData();
  if (typeof (file as any).uri === 'string') {
    const { uri, name, type } = file as any;
    formData.append(
      'file',
      {
        uri,
        name,
        type: type || 'application/octet-stream',
      } as any,
    );
  } else {
    formData.append('file', file as any);
  }
  
  const res = await apiClient.post<ParsedQuestionsResponse>(
    '/api/questions/import/excel',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return res.data;
}
