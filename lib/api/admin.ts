import { apiClient } from './client';
import type {
  AdminStatsResponse,
  Page,
  SessionResponse,
  UserResponse,
} from '~/types/api';

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const res = await apiClient.get<AdminStatsResponse>('/api/admin/stats');
  return res.data;
}

export async function getAllUsers(
  page = 0,
  size = 20,
): Promise<Page<UserResponse>> {
  const res = await apiClient.get<Page<UserResponse>>('/api/admin/users', {
    params: { page, size },
  });
  return res.data;
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<void> {
  await apiClient.put(`/api/admin/users/${userId}/role`, { role });
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}`);
}

export async function getAllSessions(params: {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}): Promise<Page<SessionResponse>> {
  const res = await apiClient.get<Page<SessionResponse>>('/api/admin/sessions', {
    params,
  });
  return res.data;
}

export async function getAdminSessionDetail(
  sessionId: string,
): Promise<Record<string, unknown>> {
  const res = await apiClient.get(`/api/admin/sessions/${sessionId}`);
  return res.data;
}

export async function forceStopSession(sessionId: string): Promise<void> {
  await apiClient.post(`/api/admin/sessions/${sessionId}/force-stop`);
}
