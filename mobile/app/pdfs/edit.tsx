import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { deletePdf, getPdfById, updatePdf } from '@/api/pdfs';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'pdf' as const;
const theme = getTypeTheme(TYPE);

export default function EditPdfScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    async function loadPdf() {
      if (!id) return;
      try {
        const data = await getPdfById(id);
        setTitle(data.pdf.title);
        setDescription(data.pdf.description || '');
        setTags(Array.isArray(data.pdf.tags) ? data.pdf.tags.map((t: any) => typeof t === 'string' ? t : t.name) : []);
      } catch (error) {
        showError('Could not load PDF');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadPdf();
  }, [id]);

  async function submit() {
    if (!id) return;
    
    const newErrors: { title?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'PDF title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await updatePdf(id, { title, description, tags: tags as any });
      setLoading(false);
      showSuccess('PDF updated successfully');
      router.back();
    } catch (error) {
      console.error('[PDF Edit] API call failed', error);
      setLoading(false);
      showError('Could not update PDF. Please try again.');
    }
  }

  function confirmDelete() {
    if (!id || deleting) return;
    Alert.alert('Delete this PDF?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removePdf() },
    ]);
  }

  async function removePdf() {
    if (!id) return;
    setDeleting(true);
    try {
      await deletePdf(id);
      showSuccess('PDF deleted');
      router.back();
    } catch (error) {
      console.error('[PDF Edit] Delete failed', error);
      setDeleting(false);
      showError('Could not delete this PDF');
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
      title="Edit PDF"
      headerRight={
        <Pressable
          style={styles.reminderButton}
          onPress={() => router.push(`/reminders/create?linkedId=${id}&linkedType=pdf`)}
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
        >
          <Text style={[styles.reminderButtonText, { color: theme.primary }]}>Add Reminder</Text>
        </Pressable>
      }
      scroll
    >
      <Input
        label="PDF Title"
        placeholder="Enter PDF title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        accentColor={theme.primary}
      />
      <Input
        label="Description"
        placeholder="Enter description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
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
        title={loading ? 'Saving...' : 'Update PDF'}
        onPress={submit}
        disabled={loading || deleting}
        color={theme.primary}
      />
      <Pressable
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={deleting || loading}
        accessibilityRole="button"
        accessibilityLabel="Delete PDF"
      >
        <AppIcon name="trash-outline" size={16} color="#BE123C" />
        <Text style={styles.deleteButtonText}>{deleting ? 'Deleting…' : 'Delete PDF'}</Text>
      </Pressable>
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
});
