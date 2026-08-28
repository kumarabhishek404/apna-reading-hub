import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSearchQuery } from './searchQuery';
import { noteContains, noteListMeta } from './noteContains';

type NoteItem = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: unknown[];
  blocks?: Array<{ type: string; content?: string | null; url?: string | null; order?: number }>;
};

function note(partial: Partial<NoteItem>): NoteItem {
  return {
    id: '1',
    title: 'Untitled',
    content: '',
    isPinned: false,
    isFavorite: false,
    createdAt: '2026-08-28T00:00:00.000Z',
    updatedAt: '2026-08-28T00:00:00.000Z',
    tags: [],
    blocks: [],
    ...partial,
  };
}

describe('parseSearchQuery', () => {
  it('treats "pdfs" as a PDF filter with no leftover text', () => {
    const parsed = parseSearchQuery('show me pdfs');
    assert.equal(parsed.contains, 'pdf');
    assert.equal(parsed.schedule, null);
    assert.equal(parsed.text, '');
  });

  it('treats "my links" as a link filter', () => {
    const parsed = parseSearchQuery('my links');
    assert.equal(parsed.contains, 'link');
    assert.equal(parsed.text, '');
  });

  it('understands websites, hindi, and a pasted url', () => {
    assert.equal(parseSearchQuery('websites').contains, 'link');
    assert.equal(parseSearchQuery('link dikhao').contains, 'link');
    assert.equal(parseSearchQuery('www.google.com').contains, 'link');
    assert.equal(parseSearchQuery('www.google.com').text, 'www.google.com');
  });

  it('keeps remaining words when asking for a physics pdf', () => {
    const parsed = parseSearchQuery('physics pdf');
    assert.equal(parsed.contains, 'pdf');
    assert.equal(parsed.text, 'physics');
  });

  it('keeps alarms and reminders as their own search', () => {
    assert.equal(parseSearchQuery('alarms').schedule, 'alarm');
    assert.equal(parseSearchQuery('my reminders').schedule, 'reminder');
    assert.equal(parseSearchQuery('reminders').contains, null);
  });
});

describe('noteContains', () => {
  it('finds PDFs stored as blocks', () => {
    const item = note({
      title: 'Physics',
      blocks: [{ type: 'pdf', content: 'Physics.pdf', url: '/uploads/a.pdf', order: 0 }],
    });
    assert.equal(noteContains(item, 'pdf'), true);
    assert.equal(noteContains(item, 'link'), false);
    assert.match(noteListMeta(item), /Physics/);
  });

  it('finds links in url blocks, https text, www text, and titles', () => {
    const withBlock = note({
      blocks: [{ type: 'url', content: 'https://example.com', url: 'https://example.com', order: 0 }],
    });
    const withHttps = note({ content: 'Read https://example.com/essay later' });
    const withWww = note({
      title: 'Nahi daaalna',
      content: 'Jaanu bhai www.google.com',
      blocks: [{ type: 'text', content: 'Jaanu bhai www.google.com', order: 0 }],
    });
    const withBare = note({
      title: 'Read later',
      blocks: [{ type: 'text', content: 'Open google.com tonight', order: 0 }],
    });
    assert.equal(noteContains(withBlock, 'link'), true);
    assert.equal(noteContains(withHttps, 'link'), true);
    assert.equal(noteContains(withWww, 'link'), true);
    assert.equal(noteContains(withBare, 'link'), true);
    assert.equal(noteContains(note({ title: 'www.instagram.com/p/1' }), 'link'), true);
    assert.equal(noteContains(note({ content: 'just writing' }), 'link'), false);
  });
});
