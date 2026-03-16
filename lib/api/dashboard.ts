import { apiClient } from './client';
import type { DashboardResponse, DashboardV2Response, UserStatsResponse } from '~/types/api';

export async function getDashboard(): Promise<DashboardResponse> {
  const res = await apiClient.get<DashboardResponse>('/api/dashboard');
  return res.data;
}

export async function getDashboardV2(): Promise<DashboardV2Response> {
  const res = await apiClient.get<DashboardV2Response>('/api/dashboard/v2');
  return res.data;
}

export async function getUserStats(): Promise<UserStatsResponse> {
  const res = await apiClient.get<UserStatsResponse>('/api/dashboard/stats');
  return res.data;
}
