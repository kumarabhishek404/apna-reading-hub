import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { deleteNote, getNotes } from '@/api/notes';
import { AppIcon } from '@/components/AppIcon';
import { useToast } from '@/components/ToastContext';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import { colors } from '@/theme/colors';
import { noteOfflineRepository } from '@/lib/offlineRepositories/noteOfflineRepository';
import { useIsOnline } from '@/lib/networkMonitor';
import type { NoteItem } from '@/types';

export default function NotesScreen() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const isOnline = useIsOnline();

  async function load() {
    console.log('[Notes] Loading notes');
    try {
      const notesRes = await getNotes();
      setNotes(notesRes.notes);
      setError(null);
      console.log('[Notes] Notes loaded successfully', { total: notesRes.notes.length });
    } catch (err) {
      console.error('[Notes] Failed to load from server, trying offline storage', err);
      
      try {
        const offlineNotes = await noteOfflineRepository.getAllEntities('note');
        setNotes(offlineNotes as NoteItem[]);
        setError(null);
        console.log('[Notes] Notes loaded from offline storage', { total: offlineNotes.length });
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
        icon: 'create-outline',
        color: '#22409a',
        onPress: () => router.push(`/notes/edit?id=${note.id}` as any),
        accessibilityLabel: 'Edit note',
      },
      {
        icon: 'heart-outline',
        color: '#FF6B35',
        onPress: () => router.push(`/notes/edit?id=${note.id}` as any),
        accessibilityLabel: 'Favorite note',
      },
      {
        icon: 'trash-outline',
        color: '#ef4444',
        onPress: () => deleteItem(note),
        accessibilityLabel: 'Delete note',
      },
    ];
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.createButtons}>
        <Link href="/notes/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ Note</Text></Pressable>
        </Link>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22409a"
              colors={['#22409a']}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable 
                style={{ flex: 1 }} 
                onPress={() => router.push(`/notes/read?id=${item.id}` as any)}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta} numberOfLines={2}>
                  {item.content || 'No content'}
                </Text>
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tags}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <Text key={tag.id} style={styles.tag}>{tag.name}</Text>
                    ))}
                  </View>
                )}
              </Pressable>
              <View style={styles.actions}>
                {getItemActions(item).map((action, index) => (
                  <Pressable
                    key={index}
                    style={styles.actionButton}
                    onPress={action.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={action.accessibilityLabel}
                  >
                    <AppIcon name={action.icon as any} size={16} color={action.color} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppIcon name="document-text-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No notes yet</Text>
              <Text style={styles.emptySubtext}>Create your first note to get started</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 4, marginBottom: 8 },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  createButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 10,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  error: { marginTop: 16, color: colors.error, paddingHorizontal: 20, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
