import { apiClient } from '@/api/client';

export interface TagItem {
  id: string;
  name: string;
  count: number;
}

export async function getTags() {
  return apiClient.get<{ tags: TagItem[] }>('/api/tags');
}

export async function createTag(name: string) {
  return apiClient.post<{ tag: TagItem }>('/api/tags', { name });
}

export async function updateTag(id: string, name: string) {
  return apiClient.patch<{ tag: TagItem }>('/api/tags', { id, name });
}

export async function deleteTag(id: string) {
  return apiClient.delete(`/api/tags?id=${encodeURIComponent(id)}`);
}

export async function getContentByTag(tagName: string) {
  return apiClient.get<{ items: any[] }>(`/api/tags/${encodeURIComponent(tagName)}/content`);
}
