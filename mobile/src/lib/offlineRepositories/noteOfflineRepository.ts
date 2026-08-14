import { GenericOfflineRepository } from './genericOfflineRepository';
import type { NoteItem } from '@/types';

// Note-specific repository using the generic implementation
export const noteOfflineRepository = new GenericOfflineRepository();

// Convenience methods that maintain the NoteItem type
export class NoteOfflineRepository {
  /**
   * Create a note offline
   */
  async createNote(noteData: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<NoteItem> {
    return noteOfflineRepository.createEntity('note', noteData);
  }

  /**
   * Update a note offline
   */
  async updateNote(localId: string, updates: Partial<NoteItem>): Promise<NoteItem> {
    return noteOfflineRepository.updateEntity('note', localId, updates);
  }

  /**
   * Delete a note offline
   */
  async deleteNote(localId: string): Promise<void> {
    return noteOfflineRepository.deleteEntity('note', localId);
  }

  /**
   * Get a note by local ID
   */
  async getNote(localId: string): Promise<NoteItem | null> {
    return noteOfflineRepository.getEntity('note', localId);
  }

  /**
   * Get all notes
   */
  async getAllNotes(): Promise<NoteItem[]> {
    return noteOfflineRepository.getAllEntities('note');
  }

  /**
   * Sync a note from server
   */
  async syncFromServer(serverNote: NoteItem): Promise<void> {
    return noteOfflineRepository.syncFromServer('note', serverNote);
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(localId: string, serverNote: NoteItem): Promise<NoteItem> {
    return noteOfflineRepository.resolveConflict('note', localId, serverNote);
  }
}

export const noteRepository = new NoteOfflineRepository();
