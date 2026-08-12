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

const AUTH_STORAGE_KEY = "apna_sathi_auth_session";

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user || !parsed?.expiresAt) return null;
    if (Date.now() > new Date(parsed.expiresAt).getTime()) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthToken(): string | null {
  const session = readAuthSession();
  return session?.token ?? null;
}
