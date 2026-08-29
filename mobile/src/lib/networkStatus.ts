export type NetworkStatus = 'online' | 'offline';

export type NetInfoSnapshot = {
  type?: string | null;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

/**
 * Airplane mode reports type "none". Android can also leave isConnected true
 * while isInternetReachable is false — treat that as offline so we never POST
 * to the API without a network.
 */
export function statusFromNetInfo(state: NetInfoSnapshot): NetworkStatus {
  if (state.type === 'none') return 'offline';
  if (state.isConnected === false) return 'offline';
  if (state.isInternetReachable === false) return 'offline';
  if (state.isConnected === true) return 'online';
  return 'offline';
}

export class OfflineError extends Error {
  readonly isOffline = true;

  constructor(path?: string) {
    super(path ? `Offline — skipped ${path}` : 'You are offline');
    this.name = 'OfflineError';
  }
}

export function isOfflineError(error: unknown): boolean {
  if (error instanceof OfflineError) return true;
  if (error instanceof Error && error.name === 'OfflineError') return true;
  const raw = error instanceof Error ? error.message : String(error);
  return /network request failed|failed to fetch|network error|offline/i.test(raw);
}
