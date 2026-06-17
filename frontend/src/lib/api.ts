const BACKEND_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

/** Browser: same-origin path (proxied by Next.js). Server: direct backend URL. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") return normalized;
  return `${BACKEND_URL}${normalized}`;
}

export function assetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") return normalized;
  return `${BACKEND_URL}${normalized}`;
}

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(apiUrl(path), options);
}
