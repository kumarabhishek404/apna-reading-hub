import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const DB_NAME = 'apna_sathi_offline.db';
const STORAGE_KEYS = {
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync',
  NETWORK_STATUS: 'network_status',
};

// SQLite database instance
let db: SQLite.SQLiteDatabase | null = null;

// Entity types
export type EntityType = 'note' | 'blog' | 'link' | 'pdf' | 'tag' | 'alarm' | 'reminder';

export type SyncStatus = 'synced' | 'dirty' | 'deleted';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  entityType: EntityType;
  data: any;
  serverId?: string;
  localId?: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EntityData {
  id: string; // local ID
  serverId?: string; // server ID after sync
  entityType: EntityType;
  data: any; // actual entity data
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// Initialize SQLite database
export async function initDatabase(): Promise<void> {
  if (db) return;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Create entities table
  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      serverId TEXT,
      entityType TEXT NOT NULL,
      data TEXT NOT NULL,
      syncStatus TEXT NOT NULL,
      lastSyncedAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  // Create sync queue table
  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      entityType TEXT NOT NULL,
      data TEXT NOT NULL,
      serverId TEXT,
      localId TEXT,
      status TEXT NOT NULL,
      retryCount INTEGER NOT NULL DEFAULT 0,
      lastError TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  // Create indexes for performance
  await db!.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_entities_entityType ON entities(entityType);
    CREATE INDEX IF NOT EXISTS idx_entities_syncStatus ON entities(syncStatus);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_entityType ON sync_queue(entityType);
  `);

  console.log('[Storage] Database initialized');
}

// Helper to ensure database is initialized
async function ensureDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    await initDatabase();
  }
  return db!;
}

// Entity CRUD operations
export async function saveEntity(entity: EntityData): Promise<void> {
  const database = await ensureDb();

  const now = Date.now();
  const existing = await getEntity(entity.id);

  if (existing) {
    await database.runAsync(
      `UPDATE entities SET serverId = ?, data = ?, syncStatus = ?, lastSyncedAt = ?, updatedAt = ? WHERE id = ?`,
      [
        entity.serverId || null,
        JSON.stringify(entity.data),
        entity.syncStatus,
        entity.lastSyncedAt || null,
        now,
        entity.id,
      ]
    );
  } else {
    await database.runAsync(
      `INSERT INTO entities (id, serverId, entityType, data, syncStatus, lastSyncedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entity.id,
        entity.serverId || null,
        entity.entityType,
        JSON.stringify(entity.data),
        entity.syncStatus,
        entity.lastSyncedAt || null,
        entity.createdAt || now,
        now,
      ]
    );
  }

  console.log('[Storage] Entity saved', { id: entity.id, entityType: entity.entityType });
}

export async function getEntity(id: string): Promise<EntityData | null> {
  const database = await ensureDb();

  const result = await database.getFirstAsync<any>(
    `SELECT * FROM entities WHERE id = ? OR serverId = ? LIMIT 1`,
    [id, id]
  );

  if (!result) return null;

  return {
    id: result.id,
    serverId: result.serverId,
    entityType: result.entityType,
    data: JSON.parse(result.data),
    syncStatus: result.syncStatus,
    lastSyncedAt: result.lastSyncedAt,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function getEntitiesByType(entityType: EntityType): Promise<EntityData[]> {
  const database = await ensureDb();

  const results = await database.getAllAsync<any>(
    `SELECT * FROM entities WHERE entityType = ? AND syncStatus != 'deleted' ORDER BY updatedAt DESC`,
    [entityType]
  );

  return results.map((row) => ({
    id: row.id,
    serverId: row.serverId,
    entityType: row.entityType,
    data: JSON.parse(row.data),
    syncStatus: row.syncStatus,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getAllEntities(): Promise<EntityData[]> {
  const database = await ensureDb();

  const results = await database.getAllAsync<any>(
    `SELECT * FROM entities WHERE syncStatus != 'deleted' ORDER BY updatedAt DESC`
  );

  return results.map((row) => ({
    id: row.id,
    serverId: row.serverId,
    entityType: row.entityType,
    data: JSON.parse(row.data),
    syncStatus: row.syncStatus,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function deleteEntity(id: string): Promise<void> {
  const database = await ensureDb();

  await database.runAsync(
    `UPDATE entities SET syncStatus = 'deleted', updatedAt = ? WHERE id = ?`,
    [Date.now(), id]
  );

  console.log('[Storage] Entity marked as deleted', { id });
}

export async function hardDeleteEntity(id: string): Promise<void> {
  const database = await ensureDb();

  await database.runAsync(`DELETE FROM entities WHERE id = ?`, [id]);
  console.log('[Storage] Entity hard deleted', { id });
}

export async function markEntityDirty(id: string): Promise<void> {
  const database = await ensureDb();

  await database.runAsync(
    `UPDATE entities SET syncStatus = 'dirty', updatedAt = ? WHERE id = ?`,
    [Date.now(), id]
  );

  console.log('[Storage] Entity marked as dirty', { id });
}

export async function markEntitySynced(id: string, serverId: string): Promise<void> {
  const database = await ensureDb();

  await database.runAsync(
    `UPDATE entities SET serverId = ?, syncStatus = 'synced', lastSyncedAt = ?, updatedAt = ? WHERE id = ?`,
    [serverId, Date.now(), Date.now(), id]
  );

  console.log('[Storage] Entity marked as synced', { id, serverId });
}

// Sync Queue operations
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>): Promise<string> {
  const id = `${item.entityType}_${item.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  const queueItem: SyncQueueItem = {
    ...item,
    id,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const database = await ensureDb();

  await database.runAsync(
    `INSERT INTO sync_queue (id, operation, entityType, data, serverId, localId, status, retryCount, lastError, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      queueItem.id,
      queueItem.operation,
      queueItem.entityType,
      JSON.stringify(queueItem.data),
      queueItem.serverId || null,
      queueItem.localId || null,
      queueItem.status,
      queueItem.retryCount,
      queueItem.lastError || null,
      queueItem.createdAt,
      queueItem.updatedAt,
    ]
  );

  console.log('[Storage] Item added to sync queue', { id: queueItem.id, operation: queueItem.operation });
  return id;
}

export async function getSyncQueueItems(status?: 'pending' | 'syncing' | 'failed' | 'completed'): Promise<SyncQueueItem[]> {
  const db1 = await ensureDb();

  let query = `SELECT * FROM sync_queue`;
  const params: any[] = [];

  if (status) {
    query += ` WHERE status = ?`;
    params.push(status);
  }

  query += ` ORDER BY createdAt ASC`;

  const results = await db1.getAllAsync<any>(query, params);

  return results.map((row) => ({
    id: row.id,
    operation: row.operation,
    entityType: row.entityType,
    data: JSON.parse(row.data),
    serverId: row.serverId,
    localId: row.localId,
    status: row.status,
    retryCount: row.retryCount,
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function updateSyncQueueItem(id: string, updates: Partial<Omit<SyncQueueItem, 'id' | 'createdAt'>>): Promise<void> {
  const database = await ensureDb();

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    params.push(updates.status);
  }
  if (updates.retryCount !== undefined) {
    setClauses.push('retryCount = ?');
    params.push(updates.retryCount);
  }
  if (updates.lastError !== undefined) {
    setClauses.push('lastError = ?');
    params.push(updates.lastError);
  }
  if (updates.data !== undefined) {
    setClauses.push('data = ?');
    params.push(JSON.stringify(updates.data));
  }
  if (updates.serverId !== undefined) {
    setClauses.push('serverId = ?');
    params.push(updates.serverId);
  }

  setClauses.push('updatedAt = ?');
  params.push(Date.now());
  params.push(id);

  await database.runAsync(
    `UPDATE sync_queue SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  console.log('[Storage] Sync queue item updated', { id });
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const database = await ensureDb();

  await database.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  console.log('[Storage] Sync queue item removed', { id });
}

export async function clearCompletedSyncItems(olderThanDays: number = 7): Promise<number> {
  const database = await ensureDb();

  const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

  const result = await database.runAsync(
    `DELETE FROM sync_queue WHERE status = 'completed' AND updatedAt < ?`,
    [cutoff]
  );

  const count = result.changes;
  console.log('[Storage] Cleared completed sync items', { count });
  return count;
}

// AsyncStorage helpers for simple key-value storage
export async function setLastSyncTimestamp(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
}

export async function getLastSyncTimestamp(): Promise<number> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  return value ? parseInt(value, 10) : 0;
}

export async function setNetworkStatus(status: 'online' | 'offline'): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_STATUS, status);
}

export async function getNetworkStatus(): Promise<'online' | 'offline'> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.NETWORK_STATUS);
  return (value as 'online' | 'offline') || 'online';
}

// File storage helpers for PDFs
export async function saveFileLocally(uri: string, filename: string): Promise<string> {
  const fileDir = `${FileSystem.documentDirectory}offline-files`;
  const fileUri = `${fileDir}/${filename}`;

  await FileSystem.makeDirectoryAsync(fileDir, { intermediates: true });
  await FileSystem.copyAsync({ from: uri, to: fileUri });

  console.log('[Storage] File saved locally', { fileUri });
  return fileUri;
}

export async function getLocalFileUri(filename: string): Promise<string | null> {
  const fileUri = `${FileSystem.documentDirectory}offline-files/${filename}`;
  const info = await FileSystem.getInfoAsync(fileUri);

  if (info.exists) {
    return fileUri;
  }

  return null;
}

export async function deleteLocalFile(filename: string): Promise<void> {
  const fileUri = `${FileSystem.documentDirectory}offline-files/${filename}`;
  const info = await FileSystem.getInfoAsync(fileUri);

  if (info.exists) {
    await FileSystem.deleteAsync(fileUri);
    console.log('[Storage] Local file deleted', { fileUri });
  }
}

// Database cleanup
export async function clearAllData(): Promise<void> {
  const database = await ensureDb();

  await database.execAsync(`DELETE FROM entities`);
  await database.execAsync(`DELETE FROM sync_queue`);
  await AsyncStorage.multiRemove([STORAGE_KEYS.LAST_SYNC, STORAGE_KEYS.NETWORK_STATUS]);

  console.log('[Storage] All data cleared');
}

// Get sync statistics
export async function getSyncStats(): Promise<{
  totalEntities: number;
  dirtyEntities: number;
  pendingSyncItems: number;
  failedSyncItems: number;
}> {
  const database = await ensureDb();

  const totalEntities = await database.getFirstAsync<any>(
    `SELECT COUNT(*) as count FROM entities WHERE syncStatus != 'deleted'`
  );

  const dirtyEntities = await database.getFirstAsync<any>(
    `SELECT COUNT(*) as count FROM entities WHERE syncStatus = 'dirty'`
  );

  const pendingSyncItems = await database.getFirstAsync<any>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`
  );

  const failedSyncItems = await database.getFirstAsync<any>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'failed'`
  );

  return {
    totalEntities: totalEntities?.count || 0,
    dirtyEntities: dirtyEntities?.count || 0,
    pendingSyncItems: pendingSyncItems?.count || 0,
    failedSyncItems: failedSyncItems?.count || 0,
  };
}
