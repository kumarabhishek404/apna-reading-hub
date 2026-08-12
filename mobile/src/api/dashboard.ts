import { apiClient } from '@/api/client';
import type { DashboardStats } from '@/types';

export async function getDashboard() {
  return apiClient.get<{
    stats: DashboardStats;
    recent: Array<{ id: string; type: string; title: string; createdAt: string }>;
    favorites: Array<{ id: string; type: string; title: string }>;
  }>('/api/dashboard');
}
