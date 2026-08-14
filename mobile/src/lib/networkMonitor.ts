import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { setNetworkStatus, getNetworkStatus } from './storage';

type NetworkStatus = 'online' | 'offline';

class NetworkMonitorClass {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = 'online';
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Initialize the network monitor
   */
  async init(): Promise<void> {
    // Load saved status
    const savedStatus = await getNetworkStatus();
    this.currentStatus = savedStatus;

    // Check current network state
    const netInfo = await NetInfo.fetch();
    this.currentStatus = netInfo.isConnected ? 'online' : 'offline';
    await setNetworkStatus(this.currentStatus);

    console.log('[NetworkMonitor] Initialized', { status: this.currentStatus });

    // Set up network state listener
    NetInfo.addEventListener(this.handleNetworkChange.bind(this));

    // Start periodic checks (as a fallback)
    this.startPeriodicChecks();
  }

  /**
   * Handle network state changes
   */
  private async handleNetworkChange(state: any): Promise<void> {
    const newStatus = state.isConnected ? 'online' : 'offline';

    if (newStatus !== this.currentStatus) {
      this.currentStatus = newStatus;
      await setNetworkStatus(newStatus);

      console.log('[NetworkMonitor] Network status changed', { status: newStatus });

      // Notify all listeners
      this.listeners.forEach((listener) => listener(newStatus));

      // If we came back online, trigger sync
      if (newStatus === 'online') {
        console.log('[NetworkMonitor] Network restored, triggering sync');
        // This will be handled by the background sync service
      }
    }
  }

  /**
   * Start periodic network checks
   */
  private startPeriodicChecks(): void {
    this.intervalId = setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      const newStatus = netInfo.isConnected ? 'online' : 'offline';

      if (newStatus !== this.currentStatus) {
        await this.handleNetworkChange(netInfo);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop periodic checks
   */
  stopPeriodicChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Add a listener for network status changes
   */
  addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);

    // Immediately call with current status
    listener(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus === 'online';
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopPeriodicChecks();
    // NetInfo automatically cleans up listeners
    this.listeners.clear();
    console.log('[NetworkMonitor] Cleaned up');
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitorClass();

// React hook for network status
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>('online');

  useEffect(() => {
    const unsubscribe = networkMonitor.addListener((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  return status;
}

// React hook for online/offline boolean
export function useIsOnline(): boolean {
  const status = useNetworkStatus();
  return status === 'online';
}
