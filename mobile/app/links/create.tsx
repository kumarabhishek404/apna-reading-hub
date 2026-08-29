import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { createLink } from '@/api/links';
import { Input } from '@/components/Input';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { linkOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { runOnlineOrLocal } from '@/lib/offlineSave';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'link' as const;
const theme = getTypeTheme(TYPE);

export default function CreateLinkScreen() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const { showSuccess, showError, showInfo } = useToast();

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
      const { savedLocally } = await runOnlineOrLocal(
        () => createLink({ title, url, description, tags, isFavorite: false }),
        () =>
          linkOfflineRepository.createEntity('link', {
            title,
            url,
            description,
            tags: tags.map((t) => ({ id: t, name: t })),
            isFavorite: false,
          }),
      );
      setLoading(false);
      if (savedLocally) {
        showInfo('Link saved locally. Will sync when online.');
      } else {
        showSuccess('Link created successfully');
      }
      router.back();
    } catch (error) {
      console.warn('[Link Create] Failed', error);
      setLoading(false);
      showError('Could not create link. Please try again.');
    }
  }

  return (
    <View style={styles.wrapper}>
      <TypeThemedScreen type={TYPE} title="New Link" headerRight={<OfflineStatusCompact />}>
        <Input
          label="Link Title"
          placeholder="Enter link title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          accentColor={theme.primary}
        />
        <Input
          label="Link URL"
          placeholder="https://example.com"
          value={url}
          onChangeText={setUrl}
          error={errors.url}
          autoCapitalize="none"
          keyboardType="url"
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
          onTagsChange={(tagNames) => setTags(tagNames)}
          accentColor={theme.primary}
        />
        <PrimaryButton
          title={loading ? 'Saving...' : 'Create Link'}
          onPress={submit}
          disabled={loading}
          color={theme.primary}
        />
      </TypeThemedScreen>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.dark }]}>Saving link...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
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
  },
});
