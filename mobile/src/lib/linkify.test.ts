import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasLink, normalizeUrl, splitLinkSegments } from './linkify';

describe('splitLinkSegments', () => {
  it('marks https URLs inside a sentence as links', () => {
    const segments = splitLinkSegments('save this link https://www.instagram.com/ today');
    const link = segments.find((segment) => segment.href);
    assert.equal(link?.text, 'https://www.instagram.com/');
    assert.equal(link?.href, 'https://www.instagram.com/');
    assert.equal(segments[0]?.text, 'save this link ');
  });

  it('treats www URLs as https links', () => {
    const segments = splitLinkSegments('Jaanu bhai www.google.com');
    const link = segments.find((segment) => segment.href);
    assert.equal(link?.href, 'https://www.google.com');
  });

  it('treats bare domains as links', () => {
    const segments = splitLinkSegments('Open google.com tonight');
    assert.equal(segments.some((segment) => segment.href === 'https://google.com'), true);
  });

  it('keeps trailing punctuation out of the href', () => {
    const segments = splitLinkSegments('Read https://example.com/essay.');
    assert.equal(segments[1]?.href, 'https://example.com/essay');
    assert.equal(segments[2]?.text, '.');
  });

  it('returns plain text when there is no URL', () => {
    const segments = splitLinkSegments('just writing');
    assert.deepEqual(segments, [{ text: 'just writing' }]);
    assert.equal(hasLink('just writing'), false);
  });
});

describe('normalizeUrl', () => {
  it('adds https to www links', () => {
    assert.equal(normalizeUrl('www.instagram.com'), 'https://www.instagram.com');
  });
});
