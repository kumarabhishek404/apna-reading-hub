import { apiClient } from '@/api/client';
import type { NoteItem } from '@/types';

export async function getNotes(options?: { search?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.tag) params.set('tag', options.tag);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get<{ notes: NoteItem[] }>(`/api/notes${query}`);
}

export async function getNoteById(id: string) {
  return apiClient.get<{ note: NoteItem }>(`/api/notes/${id}`);
}

export async function createNote(payload: {
  title: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
}) {
  return apiClient.post<{ note: NoteItem }>('/api/notes', payload);
}

export async function updateNote(id: string, payload: Partial<NoteItem>) {
  return apiClient.patch<{ note: NoteItem }>('/api/notes', { id, ...payload });
}

export async function deleteNote(id: string) {
  return apiClient.delete(`/api/notes?id=${encodeURIComponent(id)}`);
}

export async function toggleNoteFavorite(id: string) {
  return apiClient.patch<{ note: NoteItem }>('/api/notes', { id, action: 'favorite' });
}

export async function toggleNotePin(id: string) {
  return apiClient.patch<{ note: NoteItem }>('/api/notes', { id, action: 'pin' });
}