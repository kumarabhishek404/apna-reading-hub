import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { deleteNote, getNotes } from '@/api/notes';
import { AppIcon } from '@/components/AppIcon';
import { TypeContentCard } from '@/components/TypeContentCard';
import { useToast } from '@/components/ToastContext';
import { colors } from '@/theme/colors';
import { useTabContentPaddingBottom } from '@/theme/layout';
import { getTypeTheme } from '@/theme/typeColors';
import { noteOfflineRepository } from '@/lib/offlineRepositories/noteOfflineRepository';
import type { NoteItem } from '@/types';

const noteTheme = getTypeTheme('note');

export default function NotesScreen() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const tabPaddingBottom = useTabContentPaddingBottom();

  async function load() {
    try {
      const notesRes = await getNotes();
      setNotes(notesRes.notes);
      setError(null);
    } catch (err) {
      console.error('[Notes] Failed to load from server, trying offline storage', err);

      try {
        const offlineNotes = await noteOfflineRepository.getAllEntities('note');
        setNotes(offlineNotes as NoteItem[]);
        setError(null);
      } catch (offlineErr) {
        console.error('[Notes] Failed to load from offline storage', offlineErr);
        setError('Could not load notes');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function openCreate() {
    router.push('/notes/create' as any);
  }

  async function deleteItem(note: NoteItem) {
    try {
      await deleteNote(note.id);
      setNotes(notes.filter((n) => n.id !== note.id));
      showSuccess('Note deleted');
    } catch (error) {
      console.error('[Notes] Failed to delete note', error);
      showError('Could not delete note');
    }
  }

  function getItemActions(note: NoteItem) {
    return [
      {
        icon: 'create-outline' as const,
        color: noteTheme.primary,
        onPress: () => router.push(`/notes/edit?id=${note.id}` as any),
        accessibilityLabel: 'Edit note',
      },
      {
        icon: 'heart-outline' as const,
        color: colors.reminder.primary,
        onPress: () => router.push(`/notes/edit?id=${note.id}` as any),
        accessibilityLabel: 'Favorite note',
      },
      {
        icon: 'trash-outline' as const,
        color: colors.pdf.primary,
        onPress: () => deleteItem(note),
        accessibilityLabel: 'Delete note',
      },
    ];
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarCopy}>
          <Text style={styles.toolbarTitle}>Your notes</Text>
          <Text style={styles.toolbarHint}>
            {notes.length === 1 ? '1 note' : `${notes.length} notes`}
          </Text>
        </View>
        <Pressable
          style={styles.createButton}
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Create new note"
        >
          <AppIcon name="add" size={18} color="#fff" />
          <Text style={styles.createButtonText}>New note</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={noteTheme.primary} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: tabPaddingBottom }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={noteTheme.primary}
              colors={[noteTheme.primary]}
            />
          }
          renderItem={({ item }) => (
            <TypeContentCard
              type="note"
              title={item.title}
              meta={item.content || 'No content'}
              showKindBadge={false}
              onPress={() => router.push(`/notes/edit?id=${item.id}` as any)}
              actions={
                <>
                  {getItemActions(item).map((action, index) => (
                    <Pressable
                      key={index}
                      style={styles.actionButton}
                      onPress={action.onPress}
                      accessibilityRole="button"
                      accessibilityLabel={action.accessibilityLabel}
                    >
                      <AppIcon name={action.icon} size={16} color={action.color} />
                    </Pressable>
                  ))}
                </>
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <AppIcon name="document-text-outline" size={36} color={noteTheme.primary} />
              </View>
              <Text style={styles.emptyText}>No notes yet</Text>
              <Text style={styles.emptySubtext}>Create your first note to get started</Text>
              <Pressable
                style={styles.emptyCreateButton}
                onPress={openCreate}
                accessibilityRole="button"
                accessibilityLabel="Create new note"
              >
                <AppIcon name="add" size={18} color="#fff" />
                <Text style={styles.createButtonText}>Create note</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.note.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  toolbarCopy: {
    flex: 1,
    gap: 2,
  },
  toolbarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: noteTheme.dark,
    letterSpacing: -0.3,
  },
  toolbarHint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: noteTheme.primary,
    borderColor: noteTheme.dark,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: noteTheme.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  error: {
    marginTop: 16,
    color: colors.error,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: noteTheme.muted,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: noteTheme.dark,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: noteTheme.primary,
    borderColor: noteTheme.dark,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
});
