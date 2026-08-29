import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isOfflineError, OfflineError, statusFromNetInfo } from './networkStatus';

describe('statusFromNetInfo', () => {
  it('treats airplane mode (type none) as offline', () => {
    assert.equal(
      statusFromNetInfo({ type: 'none', isConnected: false, isInternetReachable: false }),
      'offline',
    );
  });

  it('treats unreachable internet as offline even if a NIC is up', () => {
    assert.equal(
      statusFromNetInfo({ type: 'wifi', isConnected: true, isInternetReachable: false }),
      'offline',
    );
  });

  it('treats a connected network as online when reachability is unknown', () => {
    assert.equal(
      statusFromNetInfo({ type: 'wifi', isConnected: true, isInternetReachable: null }),
      'online',
    );
  });

  it('treats a reachable wifi connection as online', () => {
    assert.equal(
      statusFromNetInfo({ type: 'wifi', isConnected: true, isInternetReachable: true }),
      'online',
    );
  });

  it('defaults to offline when NetInfo has not resolved yet', () => {
    assert.equal(
      statusFromNetInfo({ type: null, isConnected: null, isInternetReachable: null }),
      'offline',
    );
  });
});

describe('isOfflineError', () => {
  it('recognizes OfflineError and fetch failures', () => {
    assert.equal(isOfflineError(new OfflineError('/api/notes')), true);
    assert.equal(isOfflineError(new Error('Network request failed')), true);
    assert.equal(isOfflineError(new Error('Request failed (500)')), false);
  });
});
