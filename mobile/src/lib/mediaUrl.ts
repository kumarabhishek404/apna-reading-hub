import { API_BASE_URL } from '@/config/env';

export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^(https?:|file:|content:|data:|ph:)/i.test(path)) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${suffix}`;
}
