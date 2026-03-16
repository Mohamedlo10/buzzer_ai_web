import { apiClient } from './client';
import type { GlobalRanking, Page, GlobalRankingPaginatedResponse, SessionRankingEntry, CategoryRankingResponse } from '~/types/api';

export interface SearchRankingsParams {
  username?: string;
  page?: number;
  size?: number;
}

export async function getGlobalRankings(
  params: SearchRankingsParams = {},
): Promise<GlobalRankingPaginatedResponse> {
  const res = await apiClient.get<GlobalRankingPaginatedResponse>('/api/rankings/global', {
    params,
  });
  return res.data;
}

export async function getRoomRankings(
  roomId: string,
  params: SearchRankingsParams = {},
): Promise<Page<GlobalRanking>> {
  const res = await apiClient.get<Page<GlobalRanking>>(`/api/rankings/rooms/${roomId}`, {
    params,
  });
  return res.data;
}

export async function getMyGlobalRank(): Promise<{
  rank: number;
  totalScore: number;
  totalGames: number;
}> {
  const res = await apiClient.get('/api/rankings/global/me');
  return res.data;
}

export async function getSessionRankings(
  sessionId: string,
): Promise<SessionRankingEntry[]> {
  const res = await apiClient.get<SessionRankingEntry[]>(
    `/api/rankings/sessions/${sessionId}`,
  );
  console.log('Session Rankings:', res.data);
  return res.data;
}

export async function getCategoryRankings(sessionId: string): Promise<CategoryRankingResponse> {
  const res = await apiClient.get<CategoryRankingResponse>('/api/rankings/categories', {
    params: { sessionId },
  });
  return res.data;
}
