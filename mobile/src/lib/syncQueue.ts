import {
  addToSyncQueue,
  getSyncQueueItems,
  updateSyncQueueItem,
  removeSyncQueueItem,
  clearCompletedSyncItems,
  type SyncQueueItem,
  type SyncOperation,
  type EntityType,
} from './storage';

const MAX_RETRY_COUNT = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 60000]; // Exponential backoff in ms

export class SyncQueue {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private processor: (() => Promise<void>) | null = null;

  setProcessor(processor: () => Promise<void>) {
    this.processor = processor;
  }

  /**
   * Add an operation to the sync queue
   */
  async addOperation(
    operation: SyncOperation,
    entityType: EntityType,
    data: any,
    options?: {
      serverId?: string;
      localId?: string;
    }
  ): Promise<string> {
    const id = await addToSyncQueue({
      operation,
      entityType,
      data,
      serverId: options?.serverId,
      localId: options?.localId,
      status: 'pending',
    });

    console.log('[SyncQueue] Operation added', { id, operation, entityType });
    return id;
  }

  /**
   * Get all pending operations from the queue
   */
  async getPendingOperations(): Promise<SyncQueueItem[]> {
    return getSyncQueueItems('pending');
  }

  /**
   * Get all failed operations from the queue
   */
  async getFailedOperations(): Promise<SyncQueueItem[]> {
    return getSyncQueueItems('failed');
  }

  /**
   * Get all operations (for debugging)
   */
  async getAllOperations(): Promise<SyncQueueItem[]> {
    return getSyncQueueItems('pending' as any);
  }

  /**
   * Process a single sync operation
   * This should be called by the sync service with actual API calls
   */
  async processOperation(
    item: SyncQueueItem,
    apiCall: () => Promise<any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Mark as syncing
      await updateSyncQueueItem(item.id, { status: 'syncing' });

      // Execute the API call
      const result = await apiCall();

      // Mark as completed
      await updateSyncQueueItem(item.id, { status: 'completed' });

      // Remove from queue after a delay
      setTimeout(() => removeSyncQueueItem(item.id), 5000);

      console.log('[SyncQueue] Operation completed', { id: item.id });
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount >= MAX_RETRY_COUNT) {
        // Mark as failed permanently
        await updateSyncQueueItem(item.id, {
          status: 'failed',
          retryCount: newRetryCount,
          lastError: errorMessage,
        });

        console.error('[SyncQueue] Operation failed permanently', {
          id: item.id,
          error: errorMessage,
        });

        return { success: false, error: errorMessage };
      } else {
        // Mark as pending for retry
        await updateSyncQueueItem(item.id, {
          status: 'pending',
          retryCount: newRetryCount,
          lastError: errorMessage,
        });

        // Schedule retry with exponential backoff
        const delay = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)];
        setTimeout(() => {
          this.triggerSync();
        }, delay);

        console.log('[SyncQueue] Operation scheduled for retry', {
          id: item.id,
          retryCount: newRetryCount,
          delay,
        });

        return { success: false, error: errorMessage };
      }
    }
  }

  /**
   * Retry a failed operation
   */
  async retryOperation(id: string): Promise<void> {
    await updateSyncQueueItem(id, {
      status: 'pending',
      retryCount: 0,
      lastError: undefined,
    });

    console.log('[SyncQueue] Operation retried', { id });
    this.triggerSync();
  }

  /**
   * Remove an operation from the queue
   */
  async removeOperation(id: string): Promise<void> {
    await removeSyncQueueItem(id);
    console.log('[SyncQueue] Operation removed', { id });
  }

  /**
   * Clear old completed operations
   */
  async clearOldCompleted(olderThanDays: number = 7): Promise<number> {
    return clearCompletedSyncItems(olderThanDays);
  }

  /**
   * Start processing the queue
   * This will be called by the background sync service
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      console.log('[SyncQueue] Already processing');
      return;
    }

    this.isProcessing = true;
    console.log('[SyncQueue] Started processing');

    // Process operations periodically
    this.processingInterval = setInterval(() => {
      this.triggerSync();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.isProcessing = false;
    console.log('[SyncQueue] Stopped processing');
  }

  /**
   * Trigger sync of pending operations
   * This is called by the sync service when network is available
   */
  async triggerSync(): Promise<void> {
    if (!this.processor) {
      return;
    }

    try {
      await this.processor();
    } catch (error) {
      console.error('[SyncQueue] Processor failed', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    completed: number;
  }> {
    const pending = await getSyncQueueItems('pending');
    const syncing = await getSyncQueueItems('syncing');
    const failed = await getSyncQueueItems('failed');
    const completed = await getSyncQueueItems('completed');

    return {
      pending: pending.length,
      syncing: syncing.length,
      failed: failed.length,
      completed: completed.length,
    };
  }
}

// Singleton instance
export const syncQueue = new SyncQueue();
