import { apiClient } from './client';

export interface RegisterDeviceRequest {
  token: string;
  platform?: 'IOS' | 'ANDROID' | 'WEB';
}

export async function registerDevice(data: RegisterDeviceRequest): Promise<void> {
  await apiClient.post('/api/devices', data);
}

export async function unregisterDevice(token: string): Promise<void> {
  await apiClient.delete(`/api/devices/${encodeURIComponent(token)}`);
}
