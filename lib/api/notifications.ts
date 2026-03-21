import { apiClient } from './client';
import type { NotificationResponse } from '~/types/api';

export async function getNotifications(): Promise<NotificationResponse> {
  const res = await apiClient.get<NotificationResponse>('/api/notifications');
  return res.data;
}
