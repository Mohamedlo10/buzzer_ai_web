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

/**
 * Enregistre l'avatar composé dans l'Avatar Creator.
 *
 * Le serveur valide la spec pièce par pièce contre son catalogue, la réécrit sous forme
 * canonique, puis renvoie l'utilisateur complet — `avatarSpec` et `avatarUrl` à jour.
 */
export async function updateAvatarSpec(spec: string): Promise<UserResponse> {
  const res = await apiClient.patch<UserResponse>('/api/users/me/avatar', { spec });
  return res.data;
}

/**
 * @deprecated Ancien contrat DiceBear, conservé pour `apps/web-legacy`, qui est en production et
 * qu'on n'a pas le droit de modifier. Le serveur traduit ce couple en spec du nouveau catalogue.
 * Tout code neuf doit appeler {@link updateAvatarSpec}.
 */
export async function updateAvatar(userId: string, avatarStyle: string, avatarSeed: string): Promise<UserResponse> {
  const res = await apiClient.patch<UserResponse>(`/api/users/${userId}/avatar`, { avatarStyle, avatarSeed });
  return res.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.put('/api/users/me/password', data);
}

export async function getUserProfile(userId: string): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>(`/api/users/${userId}/profile`);
  return res.data;
}

export async function resendVerificationEmail(): Promise<void> {
  await apiClient.post('/api/users/me/resend-verification-email');
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
