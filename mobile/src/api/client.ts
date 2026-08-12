import { API_BASE_URL } from '@/config/env';
import { getAuthToken } from '@/lib/auth';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  console.log('[API Client] Request starting', { path, method: init?.method });
  const token = await getAuthToken();
  console.log('[API Client] Token retrieved', { hasToken: !!token, tokenLength: token?.length });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[API Client] Authorization header added');
  } else {
    console.warn('[API Client] No token available - request may fail if auth required');
  }

  const url = `${API_BASE_URL}${path}`;
  console.log('[API Client] Fetching', { url, headers: Object.keys(headers) });

  const response = await fetch(url, {
    headers,
    ...init,
  });

  console.log('[API Client] Response received', { status: response.status, ok: response.ok });

  if (!response.ok) {
    const responseText = await response.text();
    console.error('[API Client] Request failed', { status: response.status, responseText });

    try {
      const payload = responseText ? JSON.parse(responseText) : null;
      const message =
        payload && typeof payload === 'object'
          ? (('error' in payload && typeof payload.error === 'string' && payload.error) ||
             ('message' in payload && typeof payload.message === 'string' && payload.message) ||
             JSON.stringify(payload))
          : responseText;

      throw new Error(message || 'Request failed');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(responseText || 'Request failed');
    }
  }

  const text = await response.text();
  console.log('[API Client] Response body length', { length: text.length });
  const result = text ? (JSON.parse(text) as T) : ({} as T);
  console.log('[API Client] Request successful', { result });
  return result;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
