import { apiClient } from '@/api/client';

export type AuthUser = {
  id: string;
  fullName: string;
  title: string;
  mobile: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
  expiresAt: string;
};

export async function registerAccount(payload: {
  fullName: string;
  title: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthSession> {
  return apiClient.post<AuthSession>('/api/auth/register', payload);
}

export async function loginAccount(payload: { mobile: string; password: string }): Promise<AuthSession> {
  return apiClient.post<AuthSession>('/api/auth/login', payload);
}
