import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalizeHost(rawHost?: string | null) {
  if (!rawHost) return null;

  const host = rawHost.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }

  return host;
}

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri ?? null;
  const host = normalizeHost(hostUri);

  if (host) {
    return `http://${host}:4000`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

export const API_BASE_URL = resolveApiBaseUrl();
