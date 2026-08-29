import {
  saveEntity,
  getEntity,
  getEntitiesByType,
  markEntityDirty,
  markEntitySynced,
  deleteEntity as markDeletedEntity,
  type EntityData,
  type EntityType,
} from '../storage';
import { syncQueue } from '../syncQueue';
import { networkMonitor } from '../networkMonitor';
import type { NoteItem, BlogItem, LinkItem, PdfItem, TagItem, AlarmItem, ReminderItem } from '@/types';

function enqueueSync() {
  if (networkMonitor.isOnline()) {
    void syncQueue.triggerSync();
  }
}

type EntityDataType = NoteItem | BlogItem | LinkItem | PdfItem | TagItem | AlarmItem | ReminderItem;

export class GenericOfflineRepository {
  /**
   * Create an entity offline (saves locally first, then queues sync)
   */
  async createEntity<T extends EntityDataType>(
    entityType: EntityType,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    const localId = `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const entity: T = {
      ...data,
      id: localId,
      createdAt: now,
      updatedAt: now,
    } as T;

    // Save locally first
    const entityData: EntityData = {
      id: localId,
      entityType,
      data: entity,
      syncStatus: 'dirty',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveEntity(entityData);

    // Queue sync operation
    await syncQueue.addOperation('create', entityType, entity, { localId });
    enqueueSync();

    console.log(`[OfflineRepository] ${entityType} created offline`, { localId });
    return entity;
  }

  /**
   * Update an entity offline (saves locally first, then queues sync)
   */
  async updateEntity<T extends EntityDataType>(
    entityType: EntityType,
    localId: string,
    updates: Partial<T>
  ): Promise<T> {
    const entity = await getEntity(localId);
    if (!entity || entity.entityType !== entityType) {
      throw new Error(`${entityType} not found locally`);
    }

    const updatedEntity: T = {
      ...entity.data,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as T;

    // Save locally first
    entity.data = updatedEntity;
    entity.syncStatus = 'dirty';
    entity.updatedAt = Date.now();

    await saveEntity(entity);

    // Queue sync operation if we have a server ID
    if (entity.serverId) {
      await syncQueue.addOperation('update', entityType, updatedEntity, {
        serverId: entity.serverId,
        localId,
      });
    } else {
      // If no server ID yet, this is still a create operation
      await syncQueue.addOperation('create', entityType, updatedEntity, { localId });
    }

    enqueueSync();
    console.log(`[OfflineRepository] ${entityType} updated offline`, { localId });
    return updatedEntity;
  }

  /**
   * Delete an entity offline (marks locally as deleted, then queues sync)
   */
  async deleteEntity(entityType: EntityType, localId: string): Promise<void> {
    const entity = await getEntity(localId);
    if (!entity || entity.entityType !== entityType) {
      throw new Error(`${entityType} not found locally`);
    }

    // Mark as deleted locally
    await markDeletedEntity(localId);

    // Queue sync operation if we have a server ID
    if (entity.serverId) {
      await syncQueue.addOperation('delete', entityType, {}, {
        serverId: entity.serverId,
        localId,
      });
    } else {
      // If no server ID, just remove locally (never synced)
      await markDeletedEntity(localId);
    }

    enqueueSync();
    console.log(`[OfflineRepository] ${entityType} deleted offline`, { localId });
  }

  /**
   * Get an entity by local ID
   */
  async getEntity<T extends EntityDataType>(
    entityType: EntityType,
    localId: string
  ): Promise<T | null> {
    const entity = await getEntity(localId);
    if (!entity || entity.entityType !== entityType) {
      return null;
    }

    return entity.data as T;
  }

  /**
   * Get all entities of a type (local + synced)
   */
  async getAllEntities<T extends EntityDataType>(entityType: EntityType): Promise<T[]> {
    const entities = await getEntitiesByType(entityType);
    return entities.map((e) => e.data as T);
  }

  /**
   * Sync an entity from server to local storage
   */
  async syncFromServer<T extends EntityDataType>(
    entityType: EntityType,
    serverEntity: T
  ): Promise<void> {
    // Check if we already have this entity locally
    const existing = await getEntity(serverEntity.id);

    if (existing) {
      // Update if server version is newer
      const serverUpdatedAt = serverEntity.updatedAt ? new Date(serverEntity.updatedAt).getTime() : 0;
      const localUpdatedAt = existing.data.updatedAt ? new Date(existing.data.updatedAt).getTime() : 0;

      if (serverUpdatedAt > localUpdatedAt) {
        existing.data = serverEntity;
        existing.serverId = serverEntity.id;
        existing.syncStatus = 'synced';
        existing.lastSyncedAt = Date.now();
        existing.updatedAt = Date.now();

        await saveEntity(existing);
        console.log(`[OfflineRepository] ${entityType} synced from server (updated)`, { id: serverEntity.id });
      }
    } else {
      // Create new local entry
      const entityData: EntityData = {
        id: serverEntity.id,
        serverId: serverEntity.id,
        entityType,
        data: serverEntity,
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
        createdAt: serverEntity.createdAt ? new Date(serverEntity.createdAt).getTime() : Date.now(),
        updatedAt: Date.now(),
      };

      await saveEntity(entityData);
      console.log(`[OfflineRepository] ${entityType} synced from server (new)`, { id: serverEntity.id });
    }
  }

  /**
   * Cache a server list locally so screens can render offline later.
   */
  async hydrateFromServer<T extends EntityDataType>(
    entityType: EntityType,
    serverEntities: T[]
  ): Promise<void> {
    const chunkSize = 25;
    for (let i = 0; i < serverEntities.length; i += chunkSize) {
      const chunk = serverEntities.slice(i, i + chunkSize);
      await Promise.all(chunk.map((item) => this.syncFromServer(entityType, item)));
    }
  }

  /**
   * Resolve conflict between local and server versions
   * Strategy: Last-write-wins based on updatedAt
   */
  async resolveConflict<T extends EntityDataType>(
    entityType: EntityType,
    localId: string,
    serverEntity: T
  ): Promise<T> {
    const entity = await getEntity(localId);
    if (!entity) {
      throw new Error(`Local ${entityType} not found for conflict resolution`);
    }

    const localEntity = entity.data as T;
    const localUpdatedAt = localEntity.updatedAt ? new Date(localEntity.updatedAt).getTime() : 0;
    const serverUpdatedAt = serverEntity.updatedAt ? new Date(serverEntity.updatedAt).getTime() : 0;

    if (localUpdatedAt > serverUpdatedAt) {
      // Local wins - return local data
      console.log(`[OfflineRepository] Conflict resolved: local wins`, { localId, entityType });
      return localEntity;
    } else {
      // Server wins - update local with server changes
      console.log(`[OfflineRepository] Conflict resolved: server wins`, { localId, entityType });
      entity.data = serverEntity;
      entity.syncStatus = 'synced';
      entity.serverId = serverEntity.id;
      entity.lastSyncedAt = Date.now();
      entity.updatedAt = Date.now();

      await saveEntity(entity);
      return serverEntity;
    }
  }
}

// Singleton instances for each entity type
export const noteOfflineRepository = new GenericOfflineRepository();
export const blogOfflineRepository = new GenericOfflineRepository();
export const linkOfflineRepository = new GenericOfflineRepository();
export const pdfOfflineRepository = new GenericOfflineRepository();
export const tagOfflineRepository = new GenericOfflineRepository();
export const alarmOfflineRepository = new GenericOfflineRepository();
export const reminderOfflineRepository = new GenericOfflineRepository();
