import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getBlogById, updateBlog } from '@/api/blogs';
import { Input } from '@/components/Input';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { blogOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { useIsOnline } from '@/lib/networkMonitor';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'blog' as const;
const theme = getTypeTheme(TYPE);

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
        await updateBlog(id, { title, url, content, tags: tags as any });
        setLoading(false);
        showSuccess('Blog updated successfully');
        router.back();
      } else {
        await blogOfflineRepository.updateEntity('blog', id, {
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
      title="Edit Blog"
      headerRight={
        <View style={styles.headerRight}>
          <OfflineStatusCompact />
          <Pressable
            style={styles.reminderButton}
            onPress={() => router.push(`/reminders/create?linkedId=${id}&linkedType=blog`)}
            accessibilityRole="button"
            accessibilityLabel="Add reminder"
          >
            <Text style={[styles.reminderButtonText, { color: theme.primary }]}>Add Reminder</Text>
          </Pressable>
        </View>
      }
      scroll
    >
      <Input
        label="Blog Title"
        placeholder="Enter blog title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        accentColor={theme.primary}
      />
      <Input
        label="Blog URL"
        placeholder="https://example.com (optional)"
        value={url}
        onChangeText={setUrl}
        error={errors.url}
        autoCapitalize="none"
        keyboardType="url"
        accentColor={theme.primary}
      />
      <Input
        label="Content"
        placeholder="Enter blog content (optional)"
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
        onTagsChange={(tagNames) => setTags(tagNames)}
        accentColor={theme.primary}
      />
      <PrimaryButton
        title={loading ? 'Saving...' : 'Update Blog'}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
