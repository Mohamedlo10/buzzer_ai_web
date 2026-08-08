import { apiClient } from './client';
import type { InvitationResponse } from '~/types/api';

export async function sendInvitations(data: {
  sessionId: string;
  userIds: string[];
}): Promise<void> {
  await apiClient.post('/api/invitations', data);
}

export async function getPendingInvitations(): Promise<InvitationResponse[]> {
  const res = await apiClient.get<InvitationResponse[]>('/api/invitations/pending');
  return res.data;
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  await apiClient.put(`/api/invitations/${invitationId}/accept`);
}

export async function declineInvitation(invitationId: string): Promise<void> {
  await apiClient.put(`/api/invitations/${invitationId}/decline`);
}
