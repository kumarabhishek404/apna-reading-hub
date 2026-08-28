import { apiClient } from '@/api/client';
import type { AlarmItem } from '@/types';

export async function getAlarms(search?: string): Promise<{ alarms: AlarmItem[] }> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient.get<{ alarms: AlarmItem[] }>(`/api/alarms${query}`);
}

export async function getTodayAlarms(): Promise<{ alarms: AlarmItem[] }> {
  return apiClient.get<{ alarms: AlarmItem[] }>('/api/alarms?today=true');
}

export async function createAlarm(payload: {
  title: string;
  time: string;
  repeatDays?: number[];
  isEnabled?: boolean;
  sound?: string;
  oneShotDate?: string | null;
}) {
  console.log('[API createAlarm] Starting alarm creation', { payload });
  const result = await apiClient.post<{ alarm: AlarmItem }>('/api/alarms', payload);
  console.log('[API createAlarm] Alarm creation completed', { result });
  return result;
}

export async function updateAlarm(id: string, payload: Partial<AlarmItem>) {
  return apiClient.patch<{ alarm: AlarmItem }>('/api/alarms', { id, ...payload });
}

export async function toggleAlarm(id: string) {
  return apiClient.patch<{ alarm: AlarmItem }>('/api/alarms', { id, action: 'toggle' });
}

export async function deleteAlarm(id: string) {
  return apiClient.delete(`/api/alarms?id=${encodeURIComponent(id)}`);
}
