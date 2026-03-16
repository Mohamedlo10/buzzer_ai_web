import { apiClient } from './client';
import type { FriendRequestCreateResponse, FriendRequestResponse, FriendResponse, UserStatsResponse } from '~/types/api';

export async function getFriends(): Promise<FriendResponse[]> {
  const res = await apiClient.get<FriendResponse[]>('/api/friends');
  return res.data;
}

export async function sendFriendRequest(targetUserId: string): Promise<FriendRequestCreateResponse> {
  const res = await apiClient.post<FriendRequestCreateResponse>('/api/friends/request', {
    receiverId: targetUserId,
  });
  return res.data;
}

export async function getPendingRequests(): Promise<FriendRequestResponse[]> {
  const res = await apiClient.get<FriendRequestResponse[]>('/api/friends/requests');
  return res.data;
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await apiClient.put(`/api/friends/requests/${requestId}/accept`);
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await apiClient.put(`/api/friends/requests/${requestId}/decline`);
}

export async function removeFriend(friendId: string): Promise<void> {
  await apiClient.delete(`/api/friends/${friendId}`);
}

export async function getFriendProfile(userId: string): Promise<UserStatsResponse> {
  const res = await apiClient.get<UserStatsResponse>(`/api/friends/${userId}/profile`);
  return res.data;
}

export async function blockUser(userId: string): Promise<void> {
  await apiClient.post(`/api/friends/${userId}/block`);
}
