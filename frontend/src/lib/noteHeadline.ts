import { noteContains } from './noteContains';

const MAX_TITLE_WORDS = 5;
const MAX_TITLE_CHARS = 32;

type NoteLike = {
  title?: string;
  content?: string | null;
  blocks?: Array<{
    type: string;
    content?: string | null;
    url?: string | null;
  }>;
};

export function collapseHeadline(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalize(value: string) {
  return collapseHeadline(value).toLowerCase();
}

function sameText(left: string, right: string) {
  return Boolean(left) && normalize(left) === normalize(right);
}

function isGenericTitle(title: string) {
  return !title || /^(untitled( note)?|note|new note)$/i.test(title.trim());
}

export function fileStem(name?: string | null) {
  if (!name) return '';
  return collapseHeadline(name.replace(/\.[a-z0-9]{1,8}$/i, ''));
}

export function clipNoteHeadline(text: string, maxWords = MAX_TITLE_WORDS, maxChars = MAX_TITLE_CHARS) {
  const clean = collapseHeadline(text);
  if (!clean) return '';
  const words = clean.split(' ');
  let headline = words.slice(0, maxWords).join(' ');
  if (headline.length > maxChars) {
    headline = headline.slice(0, maxChars).trim();
    const cut = headline.lastIndexOf(' ');
    if (cut >= 12) headline = headline.slice(0, cut);
  }
  return headline;
}

export function noteBodyText(note: NoteLike) {
  const fromBlocks = (note.blocks ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.content || '')
    .join('\n');
  return collapseHeadline(note.content || fromBlocks);
}

function pdfLabel(note: NoteLike) {
  const pdf = (note.blocks ?? []).find((block) => block.type === 'pdf');
  return fileStem(pdf?.content) || '';
}

function linkLabel(note: NoteLike) {
  const block = (note.blocks ?? []).find((item) => item.type === 'url' || Boolean(item.url));
  const raw = (block?.url || block?.content || '').trim();
  if (!raw) return '';
  try {
    const host = new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname.replace(/^www\./i, '');
    return host || '';
  } catch {
    return '';
  }
}

function imageLabel(note: NoteLike) {
  const drawings = (note.blocks ?? []).filter((block) => block.type === 'handwriting').length;
  const photos = (note.blocks ?? []).filter((block) => block.type === 'image').length;
  if (drawings > 0 && photos === 0) {
    return drawings === 1 ? 'Handwritten note' : `${drawings} drawings`;
  }
  const count = drawings + photos;
  if (count === 0) return '';
  return count === 1 ? 'Photo' : `${count} photos`;
}

function storedTitleIsUseful(stored: string, body: string) {
  if (!stored || isGenericTitle(stored) || stored.length > 40) return false;
  if (body && (sameText(stored, body) || (normalize(body).startsWith(normalize(stored)) && stored.length >= body.length * 0.85))) {
    return false;
  }
  return true;
}

export function noteHeadline(note: NoteLike) {
  const body = noteBodyText(note);
  const stored = collapseHeadline(note.title || '');
  const pdf = pdfLabel(note);
  const link = linkLabel(note);
  const photos = imageLabel(note);

  if (storedTitleIsUseful(stored, body)) return clipNoteHeadline(stored);

  if (body && clipNoteHeadline(body) !== collapseHeadline(body)) {
    return clipNoteHeadline(body);
  }

  if (pdf) return clipNoteHeadline(pdf);
  if (link) return link;
  if (photos && !body) return photos;
  if (body) return clipNoteHeadline(body);
  return pdf || photos || 'Note';
}

export function persistNoteTitle(note: NoteLike) {
  const stored = collapseHeadline(note.title || '');
  const body = noteBodyText(note);
  if (stored && !isGenericTitle(stored) && !sameText(stored, body)) {
    return stored;
  }
  return noteHeadline({ ...note, title: '' });
}

function remainderAfterHeadline(body: string, headline: string) {
  const collapsedBody = collapseHeadline(body);
  const collapsedHeadline = collapseHeadline(headline);
  if (!collapsedBody || sameText(collapsedBody, collapsedHeadline)) return '';
  if (normalize(collapsedBody).startsWith(normalize(collapsedHeadline))) {
    return collapseHeadline(collapsedBody.slice(collapsedHeadline.length)).replace(/^[-–:,.]+\s*/, '');
  }
  return collapsedBody;
}

export function noteCardSnippet(note: NoteLike, headline: string) {
  const body = noteBodyText(note);
  const rest = remainderAfterHeadline(body, headline);
  if (rest) return rest;

  if (noteContains(note, 'pdf')) {
    const pdf = (note.blocks ?? []).find((block) => block.type === 'pdf');
    const label = pdf?.content || 'PDF attached';
    if (!sameText(label, headline) && !sameText(fileStem(label), headline)) return label;
  }

  if (noteContains(note, 'link')) {
    const block = (note.blocks ?? []).find(
      (item) => item.type === 'url' || item.url || item.content,
    );
    const label = block?.url || block?.content || '';
    if (label && !sameText(label, headline) && !sameText(linkLabel(note), headline)) return label;
  }

  return undefined;
}
