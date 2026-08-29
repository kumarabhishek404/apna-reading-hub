import { networkMonitor } from './networkMonitor';

/**
 * Try the server when we believe we are online, then always fall back to local
 * storage so airplane mode never blocks a save.
 */
export async function runOnlineOrLocal<TOnline, TLocal>(
  onlineFn: () => Promise<TOnline>,
  localFn: () => Promise<TLocal>,
): Promise<{ value: TOnline | TLocal; savedLocally: boolean }> {
  if (networkMonitor.isOnline()) {
    try {
      return { value: await onlineFn(), savedLocally: false };
    } catch (error) {
      console.warn('[Offline] Server save failed, storing locally', error);
    }
  }

  return { value: await localFn(), savedLocally: true };
}
