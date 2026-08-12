import { apiClient } from '@/api/client';
import type { LinkItem } from '@/types';

export async function getLinks(options?: { search?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.tag) params.set('tag', options.tag);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get<{ links: LinkItem[] }>(`/api/links${query}`);
}

export async function getLinkById(id: string) {
  return apiClient.get<{ link: LinkItem }>(`/api/links/${id}`);
}

export async function createLink(payload: {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
}) {
  return apiClient.post<{ link: LinkItem }>('/api/links', payload);
}

export async function updateLink(id: string, payload: Partial<LinkItem>) {
  return apiClient.patch<{ link: LinkItem }>('/api/links', { id, ...payload });
}

export async function deleteLink(id: string) {
  return apiClient.delete(`/api/links?id=${encodeURIComponent(id)}`);
}

export async function toggleLinkFavorite(id: string) {
  return apiClient.patch<{ link: LinkItem }>('/api/links', { id, action: 'favorite' });
}