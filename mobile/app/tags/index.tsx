import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { ActionMenu } from '@/components/ActionMenu';
import { useToast } from '@/components/ToastContext';
import { getTags, deleteTag, type TagItem } from '@/api/tags';
import { tagOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { networkMonitor } from '@/lib/networkMonitor';
import { useDataSync } from '@/lib/dataSync';
import { colors } from '@/theme/colors';

export default function TagsScreen() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { showError, showSuccess } = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (!networkMonitor.isOnline()) {
        const local = await tagOfflineRepository.getAllEntities('tag');
        setTags(local as TagItem[]);
        return;
      }
      const data = await getTags();
      setTags(data.tags);
      void tagOfflineRepository.hydrateFromServer('tag', data.tags);
    } catch (err) {
      console.warn('[Tags] Failed to load tags:', err);
      try {
        const local = await tagOfflineRepository.getAllEntities('tag');
        setTags(local as TagItem[]);
      } catch {
        setError('Could not load tags');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, []),
  );

  useDataSync(load, { immediate: false, interval: 45000 });

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/notes');
  };

  const navigateToTagContent = (tag: TagItem) => {
    router.push(`/tags/content?name=${encodeURIComponent(tag.name)}`);
  };

  const navigateToCreateTag = () => {
    router.push('/tags/create');
  };

  const handleLongPress = (tag: TagItem) => {
    setSelectedTag(tag);
    setShowMenu(true);
  };

  const onDelete = async (id: string) => {
    try {
      await deleteTag(id);
      showSuccess('Tag deleted successfully');
      await load();
    } catch (error) {
      console.error('[Tags] Failed to delete tag:', error);
      showError('Could not delete tag');
    }
  };

  const getActions = (tag: TagItem) => [
    {
      label: 'Edit',
      icon: 'create-outline',
      color: colors.primary,
      onPress: () =>
        router.push(`/tags/create?id=${tag.id}&name=${encodeURIComponent(tag.name)}`),
    },
    {
      label: 'Delete',
      icon: 'trash-outline',
      color: colors.error,
      onPress: () => onDelete(tag.id),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Tags</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading…' : `${tags.length} tag${tags.length === 1 ? '' : 's'} to organize content`}
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        <Pressable
          style={styles.createButton}
          onPress={navigateToCreateTag}
          accessibilityRole="button"
          accessibilityLabel="Create new tag"
        >
          <AppIcon name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create tag</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading tags…</Text>
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : tags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <AppIcon name="pricetag-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>No tags yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first tag, then attach it while saving notes, links, blogs, or PDFs.
            </Text>
            <Pressable style={styles.emptyButton} onPress={navigateToCreateTag}>
              <Text style={styles.emptyButtonText}>Create your first tag</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={tags}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.tagCard}
                onPress={() => navigateToTagContent(item)}
                onLongPress={() => handleLongPress(item)}
                accessibilityRole="button"
                accessibilityLabel={`View ${item.name} tag with ${item.count} items`}
              >
                <View style={styles.tagIcon}>
                  <AppIcon name="pricetag" size={18} color="#fff" />
                </View>
                <View style={styles.tagCopy}>
                  <Text style={styles.tagName}>{item.name}</Text>
                  <Text style={styles.tagMetaText}>
                    {item.count} item{item.count === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.tagCountBadge}>
                  <Text style={styles.tagCount}>{item.count}</Text>
                </View>
                <AppIcon name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            )}
          />
        )}
      </View>

      <ActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        actions={selectedTag ? getActions(selectedTag) : []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.note.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 40,
    gap: 10,
  },
  tagCard: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  tagIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagCopy: {
    flex: 1,
    gap: 2,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  tagMetaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tagCountBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagCount: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.note.soft,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  error: {
    marginTop: 16,
    color: colors.error,
    paddingHorizontal: 8,
    fontWeight: '700',
  },
});
