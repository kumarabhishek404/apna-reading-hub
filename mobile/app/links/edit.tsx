import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteLink, getLinkById, updateLink } from '@/api/links';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TagSelector } from '@/components/TagSelector';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { linkOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { runOnlineOrLocal } from '@/lib/offlineSave';
import { isLocalEntityId } from '@/lib/offlineMerge';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';
import type { LinkItem } from '@/types';

const TYPE = 'link' as const;
const theme = getTypeTheme(TYPE);

export default function EditLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    async function loadLink() {
      if (!id) return;
      try {
        const data = isLocalEntityId(id, 'link')
          ? { link: await linkOfflineRepository.getEntity<LinkItem>('link', id) }
          : await getLinkById(id).catch(async () => ({
              link: await linkOfflineRepository.getEntity<LinkItem>('link', id),
            }));
        if (!data.link) {
          showError('Could not load link');
          router.back();
          return;
        }
        setTitle(data.link.title);
        setUrl(data.link.url);
        setDescription(data.link.description || '');
        setTags(Array.isArray(data.link.tags) ? data.link.tags.map((t: any) => typeof t === 'string' ? t : t.name) : []);
      } catch (error) {
        showError('Could not load link');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadLink();
  }, [id]);

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
      const { savedLocally } = await runOnlineOrLocal(
        () => updateLink(id, { title, url, description, tags: tags as any }),
        () =>
          linkOfflineRepository.updateEntity('link', id, {
            title,
            url,
            description,
            tags: tags.map((t) => ({ id: t, name: t })),
          }),
      );
      setLoading(false);
      if (savedLocally) {
        showInfo('Link saved locally. Will sync when online.');
      } else {
        showSuccess('Link updated successfully');
      }
      router.back();
    } catch (error) {
      console.warn('[Link Edit] Failed', error);
      setLoading(false);
      showError('Could not update link. Please try again.');
    }
  }

  function confirmDelete() {
    if (!id || deleting) return;
    Alert.alert('Delete this link?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeLink() },
    ]);
  }

  async function removeLink() {
    if (!id) return;
    setDeleting(true);
    try {
      const { savedLocally } = await runOnlineOrLocal(
        () => deleteLink(id).then(() => undefined),
        () => linkOfflineRepository.deleteEntity('link', id),
      );
      showSuccess(savedLocally ? 'Link deleted on this device' : 'Link deleted');
      router.back();
    } catch (error) {
      console.error('[Link Edit] Delete failed', error);
      setDeleting(false);
      showError('Could not delete this link');
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
      title="Edit Link"
      headerRight={
        <View style={styles.headerRight}>
          <OfflineStatusCompact />
          <Pressable
            style={styles.reminderButton}
            onPress={() => router.push(`/reminders/create?linkedId=${id}&linkedType=link`)}
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
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.openButton, { backgroundColor: theme.muted, borderColor: theme.soft }]}
          onPress={openLink}
        >
          <AppIcon name="open-outline" size={18} color={theme.primary} />
          <Text style={[styles.openButtonText, { color: theme.primary }]}>Test Link</Text>
        </Pressable>
      </View>
      <PrimaryButton
        title={loading ? 'Saving...' : 'Update Link'}
        onPress={submit}
        disabled={loading || deleting}
        color={theme.primary}
      />
      <Pressable
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={deleting || loading}
        accessibilityRole="button"
        accessibilityLabel="Delete link"
      >
        <AppIcon name="trash-outline" size={16} color="#BE123C" />
        <Text style={styles.deleteButtonText}>{deleting ? 'Deleting…' : 'Delete link'}</Text>
      </Pressable>
    </TypeThemedScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  openButtonText: {
    fontWeight: '600',
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
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
