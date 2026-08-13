import { dataSyncManager } from './dataSync';

// Optimistic update wrapper for immediate UI feedback with rollback
export async function withOptimisticUpdate<T>(
  optimisticData: T,
  updateFunction: () => Promise<void>,
  rollbackFunction: () => void,
  onSuccess?: () => void,
  onError?: (error: Error) => void
) {
  try {
    console.log('[OptimisticUpdate] Applying optimistic update');
    await updateFunction();
    console.log('[OptimisticUpdate] Server update successful');
    
    // Trigger data sync to ensure consistency
    dataSyncManager.forceSync();
    
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('[OptimisticUpdate] Server update failed, rolling back', error);
    rollbackFunction();
    
    if (onError) {
      onError(error as Error);
    }
    throw error;
  }
}

// Generic optimistic update handler for array operations
export function optimisticArrayUpdate<T>(
  items: T[],
  operation: 'add' | 'update' | 'delete',
  item: T,
  idField: string = 'id'
): T[] {
  console.log('[OptimisticUpdate] Array operation', { operation, itemCount: items.length });
  
  switch (operation) {
    case 'add':
      return [...items, item];
    
    case 'update':
      return items.map((existing) => 
        (existing as any)[idField] === (item as any)[idField] ? item : existing
      );
    
    case 'delete':
      return items.filter((existing) => 
        (existing as any)[idField] !== (item as any)[idField]
      );
    
    default:
      return items;
  }
}

// Debounced sync to prevent excessive API calls
export function createDebouncedSync(delay: number = 2000) {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      console.log('[DebouncedSync] Triggering sync');
      dataSyncManager.forceSync();
      timeoutId = null;
    }, delay);
  };
}

// Create a debounced sync instance
export const debouncedSync = createDebouncedSync(3000);