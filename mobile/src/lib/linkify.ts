export type LinkSegment = {
  text: string;
  href?: string;
};

const TLD =
  'com|org|net|io|in|co|edu|gov|me|app|dev|ai|info|xyz|uk|us|ca|au|de|fr|tv|cc|site|page|blog|news|shop|to|ly';

export const LINK_RE = new RegExp(
  String.raw`\b((?:https?:\/\/|www\.)[^\s<>"'\[\]{}]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:${TLD})(?:\/[^\s<>"'\[\]{}]*)?)`,
  'gi',
);

const TRAILING_PUNCT = /[),.;:!?]+$/;

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().replace(TRAILING_PUNCT, '');
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidHttpUrl(raw: string): boolean {
  const href = normalizeUrl(raw);
  try {
    const parsed = new URL(href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function splitLinkSegments(text: string): LinkSegment[] {
  if (!text) return [];
  const segments: LinkSegment[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(LINK_RE.source, LINK_RE.flags);

  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, index) });
    }
    const href = normalizeUrl(raw);
    if (isValidHttpUrl(raw)) {
      segments.push({ text: raw.replace(TRAILING_PUNCT, ''), href });
      const punct = raw.match(TRAILING_PUNCT)?.[0] ?? '';
      if (punct) segments.push({ text: punct });
    } else {
      segments.push({ text: raw });
    }
    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text }];
}

export function hasLink(text?: string | null): boolean {
  return splitLinkSegments(text || '').some((segment) => Boolean(segment.href));
}

export function extractUrls(text?: string | null): string[] {
  return splitLinkSegments(text || '')
    .map((segment) => segment.href)
    .filter((href): href is string => Boolean(href));
}
