import { useState } from 'react';
import { router } from 'expo-router';
import { createBlog } from '@/api/blogs';
import { Input } from '@/components/Input';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { blogOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { useIsOnline } from '@/lib/networkMonitor';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'blog' as const;
const theme = getTypeTheme(TYPE);

export default function CreateBlogScreen() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const { showSuccess, showError, showInfo } = useToast();
  const isOnline = useIsOnline();

  async function submit() {
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
        await createBlog({ title, url, content, tags, isFavorite: false });
        setLoading(false);
        showSuccess('Blog created successfully');
        router.back();
      } else {
        await blogOfflineRepository.createEntity('blog', {
          title,
          url,
          content,
          tags: tags.map(t => ({ id: t, name: t })),
          isFavorite: false,
        });
        setLoading(false);
        showInfo('Blog saved locally. Will sync when online.');
        router.back();
      }
    } catch (error) {
      console.error('[Blog Create] Failed', error);
      setLoading(false);
      showError('Could not create blog. Please try again.');
    }
  }

  return (
    <TypeThemedScreen type={TYPE} title="New Blog" headerRight={<OfflineStatusCompact />}>
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
        title={loading ? 'Saving...' : 'Create Blog'}
        onPress={submit}
        disabled={loading}
        color={theme.primary}
      />
    </TypeThemedScreen>
  );
}
