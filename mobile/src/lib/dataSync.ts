import { AppState, AppStateStatus } from 'react-native';

// Data sync manager to ensure mobile and web apps stay in sync
type DataChangeListener = () => void;

class DataSyncManager {
  private listeners: Set<DataChangeListener> = new Set();
  private lastSyncTime: number = 0;
  private syncInterval: number = 30000; // 30 seconds
  private syncTimer: NodeJS.Timeout | null = null;
  private isBackground: boolean = false;

  constructor() {
    this.setupAppStateListener();
    this.startPeriodicSync();
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    this.isBackground = nextAppState === 'background';
    
    if (nextAppState === 'active') {
      console.log('[DataSync] App came to foreground, syncing data');
      this.syncAll();
    }
  };

  startPeriodicSync() {
    // Sync every 30 seconds when app is active
    this.syncTimer = setInterval(() => {
      if (!this.isBackground) {
        console.log('[DataSync] Periodic sync triggered');
        this.syncAll();
      }
    }, this.syncInterval);
  }

  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  subscribe(listener: DataChangeListener) {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  async syncAll() {
    console.log('[DataSync] Syncing all data from database');
    this.lastSyncTime = Date.now();
    
    // Notify all listeners to refresh their data
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('[DataSync] Listener error:', error);
      }
    });
  }

  forceSync() {
    console.log('[DataSync] Force sync triggered');
    this.syncAll();
  }

  getLastSyncTime() {
    return this.lastSyncTime;
  }

  shouldSync() {
    // Sync if more than 15 seconds since last sync
    return Date.now() - this.lastSyncTime > 15000;
  }
}

// Singleton instance
export const dataSyncManager = new DataSyncManager();

// Helper hook for automatic data sync
export function useDataSync(loadFunction: () => Promise<void>, options?: {
  immediate?: boolean;
  interval?: number;
}) {
  const { immediate = true, interval = 30000 } = options || {};

  useEffect(() => {
    if (immediate) {
      loadFunction();
    }

    const unsubscribe = dataSyncManager.subscribe(() => {
      console.log('[DataSync] Data change detected, refreshing');
      loadFunction();
    });

    // Optional periodic refresh
    const timer = setInterval(() => {
      if (!AppState.currentState.match(/inactive|background/)) {
        console.log('[DataSync] Periodic refresh triggered');
        loadFunction();
      }
    }, interval);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [loadFunction, immediate, interval]);
}