function defaultBackendUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Same-origin Next.js (embedded Express) during local `next dev` without a separate API
  return "http://localhost:3000";
}

const BACKEND_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  defaultBackendUrl();

/** Resolve the API base URL for the current environment. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  // Browser: prefer same-origin relative URLs unless an external API is configured
  if (typeof window !== "undefined") {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    return publicUrl ? `${publicUrl}${normalized}` : normalized;
  }

  // Server-side rendering: call backend (embedded or external)
  return `${BACKEND_URL}${normalized}`;
}

export function assetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    return publicUrl ? `${publicUrl}${normalized}` : normalized;
  }

  return `${BACKEND_URL}${normalized}`;
}

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(apiUrl(path), options);
}
