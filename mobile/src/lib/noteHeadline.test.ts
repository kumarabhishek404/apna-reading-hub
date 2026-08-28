import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clipNoteHeadline, noteCardSnippet, noteHeadline } from './noteHeadline';

describe('clipNoteHeadline', () => {
  it('keeps a short phrase intact', () => {
    assert.equal(clipNoteHeadline('save this pdf'), 'save this pdf');
  });

  it('shortens a long sentence to a few words', () => {
    assert.equal(
      clipNoteHeadline('Ideas for the next chapter of my reading journal'),
      'Ideas for the next chapter',
    );
  });
});

describe('noteHeadline', () => {
  it('does not copy a short body into a second title when a PDF name explains it', () => {
    const note = {
      title: 'save this pdf',
      content: 'save this pdf',
      blocks: [
        { type: 'text', content: 'save this pdf' },
        { type: 'pdf', content: 'Physics.pdf' },
      ],
    };
    assert.equal(noteHeadline(note), 'Physics');
    assert.equal(noteCardSnippet(note, 'Physics'), 'save this pdf');
  });

  it('hides the snippet when title and body are the same short phrase', () => {
    const note = {
      title: 'Create an ala',
      content: 'Create an ala',
      blocks: [{ type: 'text', content: 'Create an ala' }],
    };
    const title = noteHeadline(note);
    assert.equal(title, 'Create an ala');
    assert.equal(noteCardSnippet(note, title), undefined);
  });

  it('uses a short headline and the remaining body for longer writing', () => {
    const content = 'Ideas for the next chapter of my reading journal';
    const note = {
      title: content,
      content,
      blocks: [{ type: 'text', content }],
    };
    const title = noteHeadline(note);
    assert.equal(title, 'Ideas for the next chapter');
    assert.equal(noteCardSnippet(note, title), 'of my reading journal');
  });

  it('keeps a distinct user title', () => {
    const note = {
      title: 'Weekend list',
      content: 'Buy milk and finish the essay draft tonight',
      blocks: [{ type: 'text', content: 'Buy milk and finish the essay draft tonight' }],
    };
    assert.equal(noteHeadline(note), 'Weekend list');
    assert.match(noteCardSnippet(note, 'Weekend list') || '', /Buy milk/);
  });
});
