import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteNote, getNoteById, updateNote } from '@/api/notes';
import { TagSelector } from '@/components/TagSelector';
import { DocumentEditor, type ContentBlock } from '@/components/DocumentEditor';
import { LinkAwareTextInput } from '@/components/LinkAwareTextInput';
import { persistNoteTitle } from '@/lib/noteHeadline';
import { persistMediaUrl } from '@/lib/persistMedia';
import { useToast } from '@/components/ToastContext';
import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/theme/colors';
import { noteRepository } from '@/lib/offlineRepositories/noteOfflineRepository';
import { isLocalEntityId } from '@/lib/offlineMerge';
import { networkMonitor } from '@/lib/networkMonitor';

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function loadNote() {
      if (!id) return;
      try {
        const data = isLocalEntityId(id, 'note')
          ? { note: await noteRepository.getNote(id) }
          : await getNoteById(id).catch(async () => ({ note: await noteRepository.getNote(id) }));
        if (!data.note) {
          showError('Could not load note');
          router.back();
          return;
        }
        if (!isLocalEntityId(id, 'note')) {
          void noteRepository.syncFromServer(data.note);
        }
        const editorBlocks = (data.note.blocks || []).map((block: any, index: number) => ({
          ...block,
          id: `${block.type}-${index}`,
        }));
        if (editorBlocks.length === 0) {
          editorBlocks.push({
            id: 'text-legacy',
            type: 'text',
            content: data.note.content || '',
            order: 0,
            format: 'body',
          });
        }
        setBlocks(editorBlocks);
        setTitle(
          persistNoteTitle({
            title: data.note.title,
            content: data.note.content,
            blocks: editorBlocks,
          }),
        );
        setTags(Array.isArray(data.note.tags) ? data.note.tags.map((t: any) => (typeof t === 'string' ? t : t.name)) : []);
      } catch (error) {
        showError('Could not load note');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadNote();
  }, [id]);

  async function save() {
    if (!id) return;

    setLoading(true);
    try {
      const content = blocks
        .map((block) => {
          switch (block.type) {
            case 'text':
              return block.content || '';
            case 'image':
              return block.content || '';
            case 'pdf':
              return `[PDF: ${block.content}]`;
            case 'url':
              return `[URL: ${block.content}]`;
            case 'checklist':
              return `[${block.checked ? '☑' : '☐'} ${block.content}]`;
            case 'handwriting':
              return block.content || 'Handwritten note';
            case 'video':
              return `[Video: ${block.url}]`;
            default:
              return '';
          }
        })
        .join('\n');

      const durableBlocks = await Promise.all(
        blocks.map(async (block, index) => {
          const mimeType =
            block.type === 'pdf'
              ? 'application/pdf'
              : block.type === 'handwriting'
                ? 'image/jpeg'
                : 'image/jpeg';
          const url =
            (block.type === 'handwriting' || block.type === 'image' || block.type === 'pdf') &&
            block.url
              ? await persistMediaUrl(block.url, {
                  name: block.content || undefined,
                  mimeType,
                  upload: block.type !== 'handwriting' && networkMonitor.isOnline(),
                })
              : block.url || null;

          return {
            type: block.type,
            content: block.content || null,
            url,
            checked: block.checked || false,
            order: index,
            format: block.format,
            color: block.color,
          };
        }),
      );

      const payload = {
        title: persistNoteTitle({ title, content, blocks: durableBlocks }),
        content,
        tags: tags as any,
        blocks: durableBlocks,
      };

      const saveOffline = async () => {
        await noteRepository.updateNote(id, payload);
        setLoading(false);
        showSuccess(networkMonitor.isOnline() ? 'Note saved on this device' : 'Saved offline. It will sync when you are online.');
        router.back();
      };

      if (isLocalEntityId(id, 'note') || !networkMonitor.isOnline()) {
        await saveOffline();
        return;
      }

      try {
        await updateNote(id, payload);
        setLoading(false);
        showSuccess('Note saved');
        router.back();
      } catch (error) {
        console.warn('[Note Edit] API call failed, saving offline', error);
        try {
          await saveOffline();
        } catch {
          setLoading(false);
          showError('Could not update note. Please try again.');
        }
      }
    } catch (error) {
      console.error('[Note Edit] Save failed', error);
      setLoading(false);
      showError('Could not update note. Please try again.');
    }
  }

  function confirmDelete() {
    if (!id || deleting) return;
    Alert.alert('Delete this note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void removeNote(),
      },
    ]);
  }

  async function removeNote() {
    if (!id) return;
    setDeleting(true);
    try {
      if (isLocalEntityId(id, 'note') || !networkMonitor.isOnline()) {
        await noteRepository.deleteNote(id);
      } else {
        try {
          await deleteNote(id);
        } catch {
          await noteRepository.deleteNote(id);
        }
      }
      showSuccess('Note deleted');
      router.back();
    } catch (error) {
      console.error('[Note Edit] Delete failed', error);
      setDeleting(false);
      showError('Could not delete this note');
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Pressable
              style={styles.headerButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <AppIcon name="chevron-back" size={22} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.headerTitle}>Note</Text>
          <View style={styles.headerSide} />
        </View>

        <DocumentEditor blocks={blocks} onChangeBlocks={setBlocks} accentColor={colors.primary}>
          {({ body, toolbar }) => (
            <>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.paper}>
                  <View style={styles.paperBody}>
                    <LinkAwareTextInput
                      style={styles.titleInput}
                      placeholder="Title"
                      placeholderTextColor={colors.textMuted}
                      value={title}
                      onChangeText={setTitle}
                    />
                    {body}
                  </View>
                  {toolbar}
                </View>
                <TagSelector
                  label="Tags"
                  placeholder="Add tags"
                  selectedTags={tags}
                  onTagsChange={setTags}
                  accentColor={colors.primary}
                />
                <Pressable
                  style={styles.deleteButton}
                  onPress={confirmDelete}
                  disabled={deleting || loading}
                  accessibilityRole="button"
                  accessibilityLabel="Delete note"
                >
                  <AppIcon name="trash-outline" size={16} color="#BE123C" />
                  <Text style={styles.deleteButtonText}>{deleting ? 'Deleting…' : 'Delete note'}</Text>
                </Pressable>
              </ScrollView>
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <Pressable
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={save}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Save note"
                >
                  <Text style={styles.saveButtonText}>{loading ? 'Saving…' : 'Done'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </DocumentEditor>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardAvoid: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerSide: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  paper: {
    minHeight: 280,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  paperBody: {
    gap: 8,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    paddingVertical: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(190,18,60,0.08)',
  },
  deleteButtonText: {
    color: '#BE123C',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
