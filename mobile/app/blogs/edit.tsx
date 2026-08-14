import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getBlogById, updateBlog } from '@/api/blogs';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { useToast } from '@/components/ToastContext';
import { blogOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { useIsOnline } from '@/lib/networkMonitor';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import type { BlogItem } from '@/types';

export default function EditBlogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const { showSuccess, showError, showInfo } = useToast();
  const isOnline = useIsOnline();

  useEffect(() => {
    async function loadBlog() {
      if (!id) return;
      try {
        const data = await getBlogById(id);
        setTitle(data.blog.title);
        setUrl(data.blog.url || '');
        setContent(data.blog.content || '');
        setTags(Array.isArray(data.blog.tags) ? data.blog.tags.map((t: any) => typeof t === 'string' ? t : t.name) : []);
      } catch (error) {
        showError('Could not load blog');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadBlog();
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
      newErrors.title = 'Blog title is required';
    }

    if (url.trim() && !url.trim().match(/^https?:\/\/.+/)) {
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
        // Online: Update via API
        const result = await updateBlog(id, { title, url, content, tags: tags as any });
        setLoading(false);
        showSuccess('Blog updated successfully');
        router.back();
      } else {
        // Offline: Update locally first
        const blog = await blogOfflineRepository.updateEntity('blog', id, {
          title,
          url,
          content,
          tags: tags.map(t => ({ id: t, name: t })),
        });
        setLoading(false);
        showInfo('Blog saved locally. Will sync when online.');
        router.back();
      }
    } catch (error) {
      console.error('[Blog Edit] Failed', error);
      setLoading(false);
      showError('Could not update blog. Please try again.');
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
          <OfflineStatusCompact />
        </View>
        <Text style={styles.title}>Edit Blog</Text>
        <Input
          label="Blog Title"
          placeholder="Enter blog title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Input
          label="Blog URL"
          placeholder="https://example.com (optional)"
          value={url}
          onChangeText={setUrl}
          error={errors.url}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Input
          label="Content"
          placeholder="Enter blog content (optional)"
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
        <PrimaryButton title={loading ? 'Saving...' : 'Update Blog'} onPress={submit} disabled={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
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
