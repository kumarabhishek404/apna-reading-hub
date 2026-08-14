import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router } from 'expo-router';
import { createLink } from '@/api/links';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { useToast } from '@/components/ToastContext';
import { linkOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { useIsOnline } from '@/lib/networkMonitor';
import { OfflineStatusCompact } from '@/components/OfflineStatus';

export default function CreateLinkScreen() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
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
    const newErrors: { title?: string; url?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Link title is required';
    }

    if (!url.trim()) {
      newErrors.url = 'Link URL is required';
    } else if (!url.trim().match(/^https?:\/\/.+/)) {
      newErrors.url = 'Enter a valid URL (http:// or https://)';
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
        const result = await createLink({ title, url, description, tags, isFavorite: false });
        setLoading(false);
        showSuccess('Link created successfully');
        router.back();
      } else {
        // Offline: Create locally first
        const link = await linkOfflineRepository.createEntity('link', {
          title,
          url,
          description,
          tags: tags.map(t => ({ id: t, name: t })),
          isFavorite: false,
        });
        setLoading(false);
        showInfo('Link saved locally. Will sync when online.');
        router.back();
      }
    } catch (error) {
      console.error('[Link Create] Failed', error);
      setLoading(false);
      showError('Could not create link. Please try again.');
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
        <Text style={styles.title}>New Link</Text>
        <Input
          label="Link Title"
          placeholder="Enter link title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Input
          label="Link URL"
          placeholder="https://example.com"
          value={url}
          onChangeText={setUrl}
          error={errors.url}
          autoCapitalize="none"
          keyboardType="url"
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
          onTagsChange={(tagNames) => setTags(tagNames)}
        />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Link'} onPress={submit} disabled={loading} />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22409a" />
          <Text style={styles.loadingText}>Saving link...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { flex: 1, padding: 20, gap: 14 },
  headerRow: { marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d2f5f',
  },
});