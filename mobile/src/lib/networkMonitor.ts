import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setNetworkStatus } from './storage';
import { statusFromNetInfo, type NetworkStatus } from './networkStatus';

export type { NetworkStatus } from './networkStatus';
export { OfflineError, isOfflineError, statusFromNetInfo } from './networkStatus';

const FORCE_OFFLINE_KEY = 'apna.force_offline';

class NetworkMonitorClass {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = 'offline';
  private forcedOffline = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;

  async init(): Promise<void> {
    this.forcedOffline = (await AsyncStorage.getItem(FORCE_OFFLINE_KEY)) === '1';

    const netInfo = await NetInfo.fetch();
    this.currentStatus = statusFromNetInfo(netInfo);
    await setNetworkStatus(this.currentStatus);
    this.notify();

    console.log('[NetworkMonitor] Initialized', {
      status: this.getStatus(),
      forcedOffline: this.forcedOffline,
    });

    this.unsubscribeNetInfo?.();
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      void this.handleNetworkChange(state);
    });

    this.startPeriodicChecks();
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  private async applyDetectedStatus(newStatus: NetworkStatus): Promise<void> {
    if (newStatus === this.currentStatus) return;
    this.currentStatus = newStatus;
    await setNetworkStatus(newStatus);
    console.log('[NetworkMonitor] Network status changed', {
      detected: newStatus,
      visible: this.getStatus(),
    });
    this.notify();
    if (this.getStatus() === 'online') {
      console.log('[NetworkMonitor] Network restored, triggering sync');
    }
  }

  private async handleNetworkChange(state: NetInfoState): Promise<void> {
    await this.applyDetectedStatus(statusFromNetInfo(state));
  }

  private startPeriodicChecks(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      await this.applyDetectedStatus(statusFromNetInfo(netInfo));
    }, 30000);
  }

  stopPeriodicChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  getStatus(): NetworkStatus {
    return this.forcedOffline ? 'offline' : this.currentStatus;
  }

  isOnline(): boolean {
    return this.getStatus() === 'online';
  }

  isForcedOffline(): boolean {
    return this.forcedOffline;
  }

  async setForcedOffline(forced: boolean): Promise<void> {
    this.forcedOffline = forced;
    await AsyncStorage.setItem(FORCE_OFFLINE_KEY, forced ? '1' : '0');
    console.log('[NetworkMonitor] Forced offline', { forced });
    this.notify();
  }

  /**
   * A fetch failed at the network layer. Treat the device as offline so saves
   * go to SQLite instead of retrying Vercel in airplane mode.
   */
  reportUnreachable(): void {
    if (this.currentStatus === 'offline') return;
    console.warn('[NetworkMonitor] Fetch failed, switching to offline');
    void this.applyDetectedStatus('offline');
  }

  cleanup(): void {
    this.stopPeriodicChecks();
    this.unsubscribeNetInfo?.();
    this.unsubscribeNetInfo = null;
    this.listeners.clear();
    console.log('[NetworkMonitor] Cleaned up');
  }
}

export const networkMonitor = new NetworkMonitorClass();

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => networkMonitor.getStatus());

  useEffect(() => {
    return networkMonitor.addListener(setStatus);
  }, []);

  return status;
}

export function useIsOnline(): boolean {
  return useNetworkStatus() === 'online';
}

export function useForcedOffline(): boolean {
  const [forced, setForced] = useState(() => networkMonitor.isForcedOffline());

  useEffect(() => {
    return networkMonitor.addListener(() => {
      setForced(networkMonitor.isForcedOffline());
    });
  }, []);

  return forced;
}
