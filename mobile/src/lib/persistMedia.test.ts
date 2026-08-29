import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isDurableMediaUrl } from './durableMedia';

describe('isDurableMediaUrl', () => {
  it('keeps http, data, and uploaded paths', () => {
    assert.equal(isDurableMediaUrl('data:image/jpeg;base64,xx'), true);
    assert.equal(isDurableMediaUrl('https://cdn.example/page.jpg'), true);
    assert.equal(isDurableMediaUrl('/uploads/drawing.jpg'), true);
  });

  it('does not treat local file paths as saved pages', () => {
    assert.equal(isDurableMediaUrl('file:///data/user/0/drawings/page.jpg'), false);
    assert.equal(isDurableMediaUrl('content://media/external/images/1'), false);
  });
});
