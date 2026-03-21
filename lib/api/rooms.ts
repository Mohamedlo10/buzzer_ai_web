import { apiClient } from './client';
import type { CreateRoomRequest, Page, RoomCreateResponse, RoomDetailResponse, RoomSummaryResponse, UpdateRoomRequest } from '~/types/api';

export interface SearchRoomsParams {
  code?: string;
  page?: number;
  size?: number;
}

export async function searchRooms(params: SearchRoomsParams = {}): Promise<Page<RoomSummaryResponse>> {
  const res = await apiClient.get<Page<RoomSummaryResponse>>('/api/rooms/search', { params });
  return res.data;
}

export async function getUserRooms(): Promise<RoomSummaryResponse[]> {
  const res = await apiClient.get<RoomSummaryResponse[]>('/api/rooms');
  return res.data;
}

export async function createRoom(data: CreateRoomRequest): Promise<RoomCreateResponse> {
  const res = await apiClient.post<RoomCreateResponse>('/api/rooms', data);
  return res.data;
}

export async function getRoomDetail(roomId: string): Promise<RoomDetailResponse> {
  const res = await apiClient.get<RoomDetailResponse>(`/api/rooms/${roomId}`);
  return res.data;
}

export async function joinRoom(code: string): Promise<RoomDetailResponse> {
  const res = await apiClient.post<RoomDetailResponse>(`/api/rooms/${code}/join`);
  return res.data;
}

export async function leaveRoom(code: string): Promise<void> {
  await apiClient.post(`/api/rooms/${code}/leave`);
}

export async function deleteRoom(roomId: string): Promise<void> {
  await apiClient.delete(`/api/rooms/${roomId}`);
}

export async function updateRoom(roomId: string, data: UpdateRoomRequest): Promise<RoomDetailResponse> {
  const res = await apiClient.put<RoomDetailResponse>(`/api/rooms/${roomId}`, data);
  return res.data;
}

export async function inviteToRoom(roomId: string, receiverIds: string[]): Promise<void> {
  await apiClient.post(`/api/rooms/${roomId}/invite`, { receiverIds });
}
