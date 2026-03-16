import { apiClient } from './client';

/**
 * Get QR code for a session
 * Returns a PNG image blob that can be displayed as a data URL
 */
export async function getSessionQR(sessionId: string): Promise<Blob> {
  const res = await apiClient.get(`/api/qr/session/${sessionId}`, {
    responseType: 'blob',
  });
  return res.data;
}

/**
 * Get QR code for a room
 * Returns a PNG image blob that can be displayed as a data URL
 */
export async function getRoomQR(roomId: string): Promise<Blob> {
  const res = await apiClient.get(`/api/qr/room/${roomId}`, {
    responseType: 'blob',
  });
  return res.data;
}
