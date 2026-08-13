import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router } from 'expo-router';
import { createBlog } from '@/api/blogs';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { useToast } from '@/components/ToastContext';

export default function CreateBlogScreen() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const { showSuccess, showError } = useToast();

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
      const result = await createBlog({ title, url, content, tags, isFavorite: false });
      setLoading(false);
      showSuccess('Blog created successfully');
      router.back();
    } catch (error) {
      console.error('[Blog Create] API call failed', error);
      setLoading(false);
      showError('Could not create blog. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <Text style={styles.title}>New Blog</Text>
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
          onTagsChange={setTags}
        />
        <PrimaryButton title={loading ? 'Saving...' : 'Create Blog'} onPress={submit} disabled={loading} />
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