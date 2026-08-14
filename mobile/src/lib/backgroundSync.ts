import { syncQueue } from './syncQueue';
import { networkMonitor } from './networkMonitor';
import {
  getEntity,
  saveEntity,
  markEntitySynced,
  deleteEntity as markDeleted,
  hardDeleteEntity,
  type EntityType,
  type SyncOperation,
  type SyncQueueItem,
} from './storage';
import {
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from '@/api/notes';
import {
  createBlog,
  updateBlog,
  deleteBlog as deleteBlogApi,
} from '@/api/blogs';
import {
  createLink,
  updateLink,
  deleteLink as deleteLinkApi,
} from '@/api/links';
import {
  createPdf,
  updatePdf,
  deletePdf as deletePdfApi,
} from '@/api/pdfs';
import {
  createTag,
  updateTag,
  deleteTag as deleteTagApi,
} from '@/api/tags';
import {
  createAlarm,
  updateAlarm,
  deleteAlarm as deleteAlarmApi,
} from '@/api/alarms';
import {
  createReminder,
  updateReminder,
  deleteReminder as deleteReminderApi,
} from '@/api/reminders';

export class BackgroundSyncService {
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start the background sync service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[BackgroundSync] Already running');
      return;
    }

    console.log('[BackgroundSync] Starting');
    this.isRunning = true;

    // Initialize network monitor
    await networkMonitor.init();

    // Start processing the sync queue
    await syncQueue.startProcessing();

    // Set up network status listener
    networkMonitor.addListener((status) => {
      if (status === 'online') {
        console.log('[BackgroundSync] Network available, triggering sync');
        this.processQueue();
      }
    });

    // Start periodic sync checks
    this.syncInterval = setInterval(() => {
      if (networkMonitor.isOnline()) {
        this.processQueue();
      }
    }, 60000); // Sync every minute when online

    // Initial sync
    if (networkMonitor.isOnline()) {
      await this.processQueue();
    }
  }

  /**
   * Stop the background sync service
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    syncQueue.stopProcessing();
    networkMonitor.cleanup();
    this.isRunning = false;

    console.log('[BackgroundSync] Stopped');
  }

  /**
   * Process the sync queue
   */
  private async processQueue(): Promise<void> {
    if (!networkMonitor.isOnline()) {
      console.log('[BackgroundSync] Offline, skipping sync');
      return;
    }

    const pending = await syncQueue.getPendingOperations();
    if (pending.length === 0) {
      return;
    }

    console.log('[BackgroundSync] Processing queue', { count: pending.length });

    // Process operations one by one
    for (const item of pending) {
      try {
        await this.processItem(item);
      } catch (error) {
        console.error('[BackgroundSync] Failed to process item', {
          id: item.id,
          error,
        });
      }
    }

    // Clean up old completed items
    await syncQueue.clearOldCompleted(7);
  }

  /**
   * Process a single sync queue item
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    console.log('[BackgroundSync] Processing item', {
      id: item.id,
      operation: item.operation,
      entityType: item.entityType,
    });

    let apiCall: () => Promise<any>;

    switch (item.entityType) {
      case 'note':
        apiCall = this.getNoteApiCall(item);
        break;
      case 'blog':
        apiCall = this.getBlogApiCall(item);
        break;
      case 'link':
        apiCall = this.getLinkApiCall(item);
        break;
      case 'pdf':
        apiCall = this.getPdfApiCall(item);
        break;
      case 'tag':
        apiCall = this.getTagApiCall(item);
        break;
      case 'alarm':
        apiCall = this.getAlarmApiCall(item);
        break;
      case 'reminder':
        apiCall = this.getReminderApiCall(item);
        break;
      default:
        throw new Error(`Unknown entity type: ${item.entityType}`);
    }

    const result = await syncQueue.processOperation(item, apiCall);

    if (result.success && result.result) {
      // Update local entity with server response
      await this.handleSyncSuccess(item, result.result);
    }
  }

  /**
   * Handle successful sync
   */
  private async handleSyncSuccess(item: any, apiResult: any): Promise<void> {
    console.log('[BackgroundSync] Sync success', { id: item.id });

    switch (item.entityType) {
      case 'note':
      case 'blog':
      case 'link':
      case 'pdf':
      case 'tag':
      case 'alarm':
      case 'reminder':
        // Update the local entity with server ID and mark as synced
        if (item.operation === 'create' && apiResult[item.entityType]) {
          const entity = await getEntity(item.localId!);
          if (entity) {
            const serverId = apiResult[item.entityType].id;
            entity.serverId = serverId;
            entity.data = { ...entity.data, ...apiResult[item.entityType] };
            await markEntitySynced(entity.id, serverId);
          }
        } else if (item.operation === 'update' && item.serverId) {
          const entity = await getEntity(item.localId!);
          if (entity) {
            entity.data = { ...entity.data, ...apiResult[item.entityType] };
            await markEntitySynced(entity.id, item.serverId);
          }
        } else if (item.operation === 'delete' && item.localId) {
          await hardDeleteEntity(item.localId);
        }
        break;
    }
  }

  /**
   * Get the appropriate API call for note operations
   */
  private getNoteApiCall(item: SyncQueueItem): () => Promise<any> {
    switch (item.operation) {
      case 'create':
        return () => createNote(item.data);
      case 'update':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for update');
          return updateNote(item.serverId, item.data);
        };
      case 'delete':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for delete');
          return deleteNoteApi(item.serverId);
        };
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Get the appropriate API call for blog operations
   */
  private getBlogApiCall(item: SyncQueueItem): () => Promise<any> {
    switch (item.operation) {
      case 'create':
        return () => createBlog(item.data);
      case 'update':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for update');
          return updateBlog(item.serverId, item.data);
        };
      case 'delete':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for delete');
          return deleteBlogApi(item.serverId);
        };
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Get the appropriate API call for link operations
   */
  private getLinkApiCall(item: SyncQueueItem): () => Promise<any> {
    switch (item.operation) {
      case 'create':
        return () => createLink(item.data);
      case 'update':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for update');
          return updateLink(item.serverId, item.data);
        };
      case 'delete':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for delete');
          return deleteLinkApi(item.serverId);
        };
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Get the appropriate API call for PDF operations
   */
  private getPdfApiCall(item: SyncQueueItem): () => Promise<any> {
    switch (item.operation) {
      case 'create':
        return () => createPdf(item.data);
      case 'update':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for update');
          return updatePdf(item.serverId, item.data);
        };
      case 'delete':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for delete');
          return deletePdfApi(item.serverId);
        };
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Get the appropriate API call for tag operations
   */
  private getTagApiCall(item: SyncQueueItem): () => Promise<any> {
    switch (item.operation) {
      case 'create':
        return () => createTag(item.data.name || '');
      case 'update':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for update');
          const tagName = typeof item.data === 'object' && item.data.name ? item.data.name : '';
          return updateTag(item.serverId, tagName);
        };
      case 'delete':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for delete');
          return deleteTagApi(item.serverId);
        };
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Get the appropriate API call for alarm operations
   */
  private getAlarmApiCall(item: SyncQueueItem): () => Promise<any> {
    switch (item.operation) {
      case 'create':
        return () => createAlarm(item.data);
      case 'update':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for update');
          return updateAlarm(item.serverId, item.data);
        };
      case 'delete':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for delete');
          return deleteAlarmApi(item.serverId);
        };
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Get the appropriate API call for reminder operations
   */
  private getReminderApiCall(item: SyncQueueItem): () => Promise<any> {
    switch (item.operation) {
      case 'create':
        return () => createReminder(item.data);
      case 'update':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for update');
          return updateReminder(item.serverId, item.data);
        };
      case 'delete':
        return () => {
          if (!item.serverId) throw new Error('Server ID required for delete');
          return deleteReminderApi(item.serverId);
        };
      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(): Promise<void> {
    console.log('[BackgroundSync] Manual sync triggered');
    await this.processQueue();
  }

  /**
   * Get sync statistics
   */
  async getStats() {
    const queueStats = await syncQueue.getStats();
    const isOnline = networkMonitor.isOnline();

    return {
      isOnline,
      queue: queueStats,
    };
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncService();
