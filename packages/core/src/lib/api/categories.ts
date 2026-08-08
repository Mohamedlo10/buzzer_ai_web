import { apiClient } from './client';

export async function searchCategories(q: string, limit = 3): Promise<string[]> {
  const res = await apiClient.get<string[]>('/api/categories/search', { params: { q, limit } });
  return res.data;
}
