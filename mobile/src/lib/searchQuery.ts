export type NoteContainsKind = 'pdf' | 'link' | 'image' | 'handwriting';
export type SearchScheduleKind = 'alarm' | 'reminder';

export type ParsedSearchQuery = {
  contains: NoteContainsKind | null;
  schedule: SearchScheduleKind | null;
  text: string;
};

const STOP_WORDS =
  /\b(show|me|my|all|the|saved|find|search|for|of|with|please|list|that|have|has|containing|include|includes|dikhao|dikha|mujhe|wale|wali)\b/gi;

function looksLikeUrlQuery(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (/^(https?:\/\/|www\.)/i.test(trimmed)) return true;
  return /\.(com|org|net|io|in|co|edu|gov|me|app|dev)(?:\/\S*)?$/i.test(trimmed);
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  let text = (query || '').trim();
  let contains: NoteContainsKind | null = null;
  let schedule: SearchScheduleKind | null = null;

  if (/\b(alarms?)\b/i.test(text) && !/\bremind/i.test(text)) {
    schedule = 'alarm';
    text = text.replace(/\b(alarms?)\b/gi, ' ');
  } else if (/\b(reminders?)\b/i.test(text)) {
    schedule = 'reminder';
    text = text.replace(/\b(reminders?)\b/gi, ' ');
  }

  if (/\b(pdfs?)\b/i.test(text)) {
    contains = 'pdf';
    text = text.replace(/\b(pdfs?|documents?)\b/gi, ' ');
  } else if (/\b(links?|urls?|bookmarks?|websites?|webpages?|hyperlinks?|weblinks?)\b|लिंक/i.test(text)) {
    contains = 'link';
    text = text.replace(/\b(links?|urls?|bookmarks?|websites?|webpages?|hyperlinks?|weblinks?)\b|लिंक/gi, ' ');
  } else if (/\b(handwrit(?:ing|ten)|drawings?|sketches?)\b/i.test(text)) {
    contains = 'handwriting';
    text = text.replace(/\b(handwrit(?:ing|ten)|drawings?|sketches?)\b/gi, ' ');
  } else if (/\b(images?|photos?|pictures?|pics?)\b/i.test(text)) {
    contains = 'image';
    text = text.replace(/\b(images?|photos?|pictures?|pics?)\b/gi, ' ');
  } else if (/\b(blogs?|articles?)\b/i.test(text)) {
    text = text.replace(/\b(blogs?|articles?)\b/gi, ' ');
  } else if (looksLikeUrlQuery(text)) {
    contains = 'link';
  }

  if (contains || schedule) {
    text = text.replace(/\b(notes?|items?|ones?)\b/gi, ' ');
  }

  text = text.replace(STOP_WORDS, ' ').replace(/\s+/g, ' ').trim();
  return { contains, schedule, text };
}
