import { hasLink } from './linkify';

export type NoteContainsKind = 'pdf' | 'link' | 'image' | 'handwriting';

type NoteLike = {
  title?: string;
  content?: string | null;
  blocks?: Array<{
    type: string;
    content?: string | null;
    url?: string | null;
  }>;
};

export function noteHaystack(note: NoteLike): string {
  const parts = [
    note.title || '',
    note.content || '',
    ...(note.blocks ?? []).map((block) => `${block.content || ''} ${block.url || ''}`),
  ];
  return parts.join(' ').toLowerCase();
}

function noteHasUrl(note: NoteLike): boolean {
  if (hasLink(note.title) || hasLink(note.content)) return true;
  return (note.blocks ?? []).some(
    (block) => block.type === 'url' || hasLink(block.url) || hasLink(block.content),
  );
}

export function noteContains(note: NoteLike, kind: NoteContainsKind): boolean {
  const blocks = note.blocks ?? [];

  if (kind === 'pdf') {
    return blocks.some((block) => block.type === 'pdf') || /\[PDF:/i.test(note.content || '');
  }

  if (kind === 'handwriting') {
    return (
      blocks.some((block) => block.type === 'handwriting') ||
      /\[Handwriting:/i.test(note.content || '')
    );
  }

  if (kind === 'image') {
    return blocks.some((block) => block.type === 'image');
  }

  return noteHasUrl(note);
}

export function noteMatchesText(note: NoteLike, query: string): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ''))
    .filter((token) => token.length > 1);
  if (tokens.length === 0) return true;
  const haystack = noteHaystack(note);
  return tokens.every((token) => haystack.includes(token));
}

export function noteListMeta(note: NoteLike): string {
  if (noteContains(note, 'pdf')) {
    const pdf = (note.blocks ?? []).find((block) => block.type === 'pdf');
    return pdf?.content || 'PDF in this note';
  }
  if (noteContains(note, 'link')) {
    const fromBlock = (note.blocks ?? []).find(
      (block) => block.type === 'url' || hasLink(block.url) || hasLink(block.content),
    );
    if (fromBlock?.url || fromBlock?.content) return fromBlock.url || fromBlock.content || 'Contains a link';
    if (hasLink(note.title)) return note.title || 'Contains a link';
    return note.content || 'Contains a link';
  }
  if (noteContains(note, 'image')) {
    return 'Contains photos';
  }
  if (noteContains(note, 'handwriting')) {
    return 'Handwritten note';
  }
  return note.content || 'No content';
}
