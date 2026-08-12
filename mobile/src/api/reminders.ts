import { apiClient } from '@/api/client';
import type { ReminderItem } from '@/types';

export async function getReminders(options?: { search?: string; upcoming?: boolean; includeCompleted?: boolean }) {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.upcoming) params.set('upcoming', 'true');
  if (options?.includeCompleted) params.set('includeCompleted', 'true');
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get<{ reminders: ReminderItem[] }>(`/api/reminders${query}`);
}

export async function createReminder(payload: {
  title: string;
  description?: string;
  dueAt: string;
  priority?: string;
  repeat?: string;
  sound?: string;
}) {
  return apiClient.post<{ reminder: ReminderItem }>('/api/reminders', payload);
}

export async function updateReminder(id: string, payload: Partial<ReminderItem>) {
  return apiClient.patch<{ reminder: ReminderItem }>('/api/reminders', { id, ...payload });
}

export async function completeReminder(id: string) {
  return apiClient.patch<{ reminder: ReminderItem }>('/api/reminders', { id, action: 'complete' });
}

export async function deleteReminder(id: string) {
  return apiClient.delete(`/api/reminders?id=${encodeURIComponent(id)}`);
}
