import { apiClient } from './client';
import type {
  ChangePasswordRequest,
  Page,
  UpdateProfileRequest,
  UserResponse,
} from '~/types/api';

export async function getMe(): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>('/api/users/me');
  return res.data;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
  const res = await apiClient.put<UserResponse>('/api/users/me', data);
  return res.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.put('/api/users/me/password', data);
}

export async function getUserProfile(userId: string): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>(`/api/users/${userId}/profile`);
  return res.data;
}

export async function searchUsers(
  query: string,
  page = 0,
  size = 20,
): Promise<Page<UserResponse>> {
  const res = await apiClient.get<Page<UserResponse>>('/api/users/search', {
    params: { q: query, page, size },
  });
  return res.data;
}
