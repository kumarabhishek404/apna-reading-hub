import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getNoteById, updateNote } from '@/api/notes';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'note' as const;
const theme = getTypeTheme(TYPE);

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    async function loadNote() {
      if (!id) return;
      try {
        const data = await getNoteById(id);
        setTitle(data.note.title);
        setContent(data.note.content || '');
        setTags(Array.isArray(data.note.tags) ? data.note.tags.map((t: any) => typeof t === 'string' ? t : t.name) : []);
      } catch (error) {
        showError('Could not load note');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadNote();
  }, [id]);

  async function submit() {
    if (!id) return;
    
    const newErrors: { title?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Note title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await updateNote(id, { title, content, tags: tags as any });
      setLoading(false);
      showSuccess('Note updated successfully');
      router.back();
    } catch (error) {
      console.error('[Note Edit] API call failed', error);
      setLoading(false);
      showError('Could not update note. Please try again.');
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TypeThemedScreen
      type={TYPE}
      title="Edit Note"
      headerRight={
        <Pressable
          style={styles.reminderButton}
          onPress={() => router.push(`/reminders/create?linkedId=${id}&linkedType=note`)}
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
        >
          <Text style={[styles.reminderButtonText, { color: theme.primary }]}>Add Reminder</Text>
        </Pressable>
      }
      scroll
    >
      <Input
        label="Note Title"
        placeholder="Enter note title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        accentColor={theme.primary}
      />
      <Input
        label="Content"
        placeholder="Enter note content (optional)"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        accentColor={theme.primary}
      />
      <TagSelector
        label="Tags"
        placeholder="Select tags (optional)"
        selectedTags={tags}
        onTagsChange={setTags}
        accentColor={theme.primary}
      />
      <PrimaryButton
        title={loading ? 'Saving...' : 'Update Note'}
        onPress={submit}
        disabled={loading}
        color={theme.primary}
      />
    </TypeThemedScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  reminderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  reminderButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
