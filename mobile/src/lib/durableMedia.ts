export function isDurableMediaUrl(url?: string | null) {
  if (!url) return false;
  return /^(https?:|data:)/i.test(url) || url.startsWith('/uploads/');
}
