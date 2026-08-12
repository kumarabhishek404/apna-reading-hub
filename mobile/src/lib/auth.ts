import * as SecureStore from 'expo-secure-store';

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

const AUTH_STORAGE_KEY = 'apna_sathi_auth_session';

export async function getStoredSession(): Promise<AuthSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user || !parsed?.expiresAt) {
      await clearSession();
      return null;
    }

    if (Date.now() > new Date(parsed.expiresAt).getTime()) {
      await clearSession();
      return null;
    }

    return parsed;
  } catch {
    await clearSession();
    return null;
  }
}

export async function saveSession(session: AuthSession) {
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}

export async function getAuthToken(): Promise<string | null> {
  const session = await getStoredSession();
  return session?.token ?? null;
}
