import { API_BASE_URL } from '@/config/env';
import { getAuthToken } from '@/lib/auth';

function networkErrorMessage(error: unknown, url: string) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/network request failed|failed to fetch|network error/i.test(raw)) {
    return (
      `Network request failed.\n` +
      `Tried: ${url}\n` +
      `If this is a release build, set EXPO_PUBLIC_API_URL to your Vercel URL and rebuild. ` +
      `For local devices, use your computer's LAN IP (not localhost).`
    );
  }
  return raw || 'Request failed';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    console.error('[API Client] Network failure', { url, error });
    throw new Error(networkErrorMessage(error, url));
  }

  if (!response.ok) {
    const responseText = await response.text();
    console.error('[API Client] Request failed', { status: response.status, url, responseText });

    try {
      const payload = responseText ? JSON.parse(responseText) : null;
      const message =
        payload && typeof payload === 'object'
          ? (('error' in payload && typeof payload.error === 'string' && payload.error) ||
             ('message' in payload && typeof payload.message === 'string' && payload.message) ||
             JSON.stringify(payload))
          : responseText;

      throw new Error(message || `Request failed (${response.status})`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(responseText || `Request failed (${response.status})`);
    }
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
