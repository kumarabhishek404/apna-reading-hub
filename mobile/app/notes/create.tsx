import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router } from 'expo-router';
import { createNote } from '@/api/notes';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { useToast } from '@/components/ToastContext';
import { noteRepository } from '@/lib/offlineRepositories/noteOfflineRepository';
import { useIsOnline } from '@/lib/networkMonitor';
import { OfflineStatusCompact } from '@/components/OfflineStatus';

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { showSuccess, showError, showInfo } = useToast();
  const isOnline = useIsOnline();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/content');
  };

  async function submit() {
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
      if (isOnline) {
        // Online: Create via API
        const result = await createNote({ title, content, tags, isPinned: false, isFavorite: false });
        setLoading(false);
        showSuccess('Note created successfully');
        router.back();
      } else {
        // Offline: Create locally first
        const note = await noteRepository.createNote({ 
          title, 
          content, 
          tags: tags.map(t => ({ id: t, name: t })), 
          isPinned: false, 
          isFavorite: false 
        });
        setLoading(false);
        showInfo('Note saved locally. Will sync when online.');
        router.back();
      }
    } catch (error) {
      console.error('[Note Create] Failed', error);
      setLoading(false);
      showError('Could not create note. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
          <OfflineStatusCompact />
        </View>
        <Text style={styles.title}>New Note</Text>
        <Input
          label="Note Title"
          placeholder="Enter note title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Input
          label="Content"
          placeholder="Enter note content (optional)"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={4}
        />
        <TagSelector
          label="Tags"
          placeholder="Select tags (optional)"
          selectedTags={tags}
          onTagsChange={(tagNames) => setTags(tagNames)}
        />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Note'} onPress={submit} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { flex: 1, padding: 20, gap: 14 },
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
});