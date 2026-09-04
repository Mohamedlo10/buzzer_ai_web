import { apiClient } from './client';
import type {
  Page,
  CreateSupportTicketRequest,
  SupportTicketResponse,
  AdminSupportTicketResponse,
  AdminUpdateTicketStatusRequest,
} from '~/types/api';

/**
 * Créer un ticket de support joueur (POST /api/support/tickets).
 * Source Java : SupportController.java
 */
export async function createTicket(
  payload: CreateSupportTicketRequest,
): Promise<SupportTicketResponse> {
  const res = await apiClient.post<SupportTicketResponse>('/api/support/tickets', payload);
  return res.data;
}

/**
 * Récupérer la liste paginée des tickets (admin) (GET /api/admin/support/tickets).
 * Source Java : AdminSupportController.java
 */
export async function getAdminTickets(params?: {
  status?: string;
  page?: number;
  size?: number;
}): Promise<Page<AdminSupportTicketResponse>> {
  const res = await apiClient.get<Page<AdminSupportTicketResponse>>('/api/admin/support/tickets', {
    params,
  });
  return res.data;
}

/**
 * Mettre à jour le statut d'un ticket (admin) (PUT /api/admin/support/tickets/{id}/status).
 * Source Java : AdminSupportController.java
 */
export async function updateAdminTicketStatus(
  id: string,
  payload: AdminUpdateTicketStatusRequest,
): Promise<AdminSupportTicketResponse> {
  const res = await apiClient.put<AdminSupportTicketResponse>(
    `/api/admin/support/tickets/${id}/status`,
    payload,
  );
  return res.data;
}
