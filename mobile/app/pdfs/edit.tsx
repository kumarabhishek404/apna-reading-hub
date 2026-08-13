import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getPdfById, updatePdf } from '@/api/pdfs';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { useToast } from '@/components/ToastContext';
import type { PdfItem } from '@/types';

export default function EditPdfScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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
        setTags(data.pdf.tags || []);
      } catch (error) {
        showError('Could not load PDF');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadPdf();
  }, [id]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/content');
  };

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
      const result = await updatePdf(id, { title, description, tags });
      setLoading(false);
      showSuccess('PDF updated successfully');
      router.back();
    } catch (error) {
      console.error('[PDF Edit] API call failed', error);
      setLoading(false);
      showError('Could not update PDF. Please try again.');
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <Text style={styles.title}>Edit PDF</Text>
        <Input
          label="PDF Title"
          placeholder="Enter PDF title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Input
          label="Description"
          placeholder="Enter description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        <TagSelector
          label="Tags"
          placeholder="Select tags (optional)"
          selectedTags={tags}
          onTagsChange={setTags}
        />
        <PrimaryButton title={loading ? 'Saving...' : 'Update PDF'} onPress={submit} disabled={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  headerRow: { marginBottom: 4 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#dfe9ff',
  },
  title: { fontSize: 30, fontWeight: '800', color: '#1d2f5f', letterSpacing: -0.5 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
});
