import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getLinkById, updateLink } from '@/api/links';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { useToast } from '@/components/ToastContext';
import type { LinkItem } from '@/types';

export default function EditLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    async function loadLink() {
      if (!id) return;
      try {
        const data = await getLinkById(id);
        setTitle(data.link.title);
        setUrl(data.link.url);
        setDescription(data.link.description || '');
        setTags(data.link.tags || []);
      } catch (error) {
        showError('Could not load link');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadLink();
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
      const result = await updateLink(id, { title, url, description, tags });
      setLoading(false);
      showSuccess('Link updated successfully');
      router.back();
    } catch (error) {
      console.error('[Link Edit] API call failed', error);
      setLoading(false);
      showError('Could not update link. Please try again.');
    }
  }

  const openLink = async () => {
    if (url) {
      const linkUrl = url.startsWith('http') ? url : `https://${url}`;
      await Linking.openURL(linkUrl);
    }
  };

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
        <Text style={styles.title}>Edit Link</Text>
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
          onTagsChange={setTags}
        />
        <View style={styles.buttonRow}>
          <Pressable style={styles.openButton} onPress={openLink}>
            <AppIcon name="open-outline" size={18} color="#22409a" />
            <Text style={styles.openButtonText}>Test Link</Text>
          </Pressable>
        </View>
        <PrimaryButton title={loading ? 'Saving...' : 'Update Link'} onPress={submit} disabled={loading} />
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef4ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dfe9ff',
  },
  openButtonText: {
    color: '#22409a',
    fontWeight: '600',
    fontSize: 14,
  },
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
