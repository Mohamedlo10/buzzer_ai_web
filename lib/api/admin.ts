import { apiClient } from './client';
import type {
  AdminStatsResponse,
  AdminSessionSummaryResponse,
  AdminSessionDetailResponse,
  AdminRoomSummaryResponse,
  AdminRoomDetailResponse,
  AdminCategoryResponse,
  AdminQuestionResponse,
  Page,
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
}): Promise<Page<AdminSessionSummaryResponse>> {
  const res = await apiClient.get<Page<AdminSessionSummaryResponse>>('/api/admin/sessions', {
    params,
  });
  return res.data;
}

export async function getAdminSessionDetail(
  sessionId: string,
): Promise<AdminSessionDetailResponse> {
  const res = await apiClient.get<AdminSessionDetailResponse>(`/api/admin/sessions/${sessionId}`);
  return res.data;
}

export async function forceStopSession(sessionId: string): Promise<void> {
  await apiClient.post(`/api/admin/sessions/${sessionId}/force-stop`);
}

export async function getAdminRooms(params: {
  search?: string;
  page?: number;
  size?: number;
}): Promise<Page<AdminRoomSummaryResponse>> {
  const res = await apiClient.get<Page<AdminRoomSummaryResponse>>('/api/admin/rooms', {
    params,
  });
  return res.data;
}

export async function getAdminRoomDetail(roomId: string): Promise<AdminRoomDetailResponse> {
  const res = await apiClient.get<AdminRoomDetailResponse>(`/api/admin/rooms/${roomId}`);
  return res.data;
}

export async function getAdminQuestionCategories(params: {
  search?: string;
  page?: number;
  size?: number;
}): Promise<Page<AdminCategoryResponse>> {
  const res = await apiClient.get<Page<AdminCategoryResponse>>('/api/admin/questions/categories', {
    params,
  });
  return res.data;
}

export async function getAdminQuestions(params: {
  category: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<Page<AdminQuestionResponse>> {
  const res = await apiClient.get<Page<AdminQuestionResponse>>('/api/admin/questions', {
    params,
  });
  return res.data;
}
