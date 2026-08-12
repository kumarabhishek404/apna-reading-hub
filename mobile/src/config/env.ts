import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Production web/API host (Express is served under the same Vercel origin). */
export const PRODUCTION_API_URL = 'https://apna-reading-hub.vercel.app';

function normalizeHost(rawHost?: string | null) {
  if (!rawHost) return null;

  const host = rawHost.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    // Android emulator → host machine loopback
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }

  return host;
}

function fromExtra() {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const value = extra?.apiUrl?.trim();
  return value ? value.replace(/\/$/, '') : null;
}

function localDevApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.experienceUrl ?? null;
  const host = normalizeHost(
    typeof hostUri === 'string'
      ? hostUri.replace(/^[a-z]+:\/\//i, '').split('/')[0]
      : null,
  );

  if (host) {
    return `http://${host}:4001`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:4001' : 'http://localhost:4001';
}

/**
 * API base URL resolution order:
 * 1. EXPO_PUBLIC_API_URL (env / EAS profile) — highest priority
 * 2. Release builds: app.json extra.apiUrl, then production Vercel URL
 * 3. Dev builds without env: Expo host machine on :4001
 */
function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (!__DEV__) {
    return fromExtra() ?? PRODUCTION_API_URL;
  }

  // Local Expo Go / dev client with no env override.
  return localDevApiUrl();
}

export const API_BASE_URL = resolveApiBaseUrl();
