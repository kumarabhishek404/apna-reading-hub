import { apiClient } from '@/api/client';
import type { BlogItem } from '@/types';

export async function getBlogs(options?: { search?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.tag) params.set('tag', options.tag);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get<{ blogs: BlogItem[] }>(`/api/blogs${query}`);
}

export async function getBlogById(id: string) {
  return apiClient.get<{ blog: BlogItem }>(`/api/blogs/${id}`);
}

export async function createBlog(payload: {
  title: string;
  url?: string;
  content?: string;
  tags?: string[];
  isFavorite?: boolean;
}) {
  return apiClient.post<{ blog: BlogItem }>('/api/blogs', payload);
}

export async function updateBlog(id: string, payload: Partial<BlogItem>) {
  return apiClient.patch<{ blog: BlogItem }>('/api/blogs', { id, ...payload });
}

export async function deleteBlog(id: string) {
  return apiClient.delete(`/api/blogs?id=${encodeURIComponent(id)}`);
}

export async function toggleBlogFavorite(id: string) {
  return apiClient.patch<{ blog: BlogItem }>('/api/blogs', { id, action: 'favorite' });
}