import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { BrandHeader } from '@/components/BrandHeader';
import { getTags, deleteTag, type TagItem } from '@/api/tags';
import { ActionMenu } from '@/components/ActionMenu';
import { useToast } from '@/components/ToastContext';
import { useDataSync } from '@/lib/dataSync';

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
      const data = await getTags();
      setTags(data.tags);
    } catch (err) {
      console.error('[Tags] Failed to load tags:', err);
      setError('Could not load tags');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Auto-sync data for database consistency
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
    router.replace('/(tabs)/content');
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

  const getActions = (tag: TagItem) => [
    {
      label: 'Edit',
      icon: 'create-outline',
      color: '#22409a',
      onPress: () => router.push(`/tags/create?id=${tag.id}&name=${encodeURIComponent(tag.name)}`),
    },
    {
      label: 'Delete',
      icon: 'trash-outline',
      color: '#ef4444',
      onPress: () => onDelete(tag.id),
    },
  ];

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22409a" />
          <Text style={styles.loadingText}>Loading tags...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
        </Pressable>
        <BrandHeader title="Tags" subtitle="Organize your content" />
      </View>

      <View style={styles.container}>
        <Pressable style={styles.createButton} onPress={navigateToCreateTag} accessibilityRole="button" accessibilityLabel="Create new tag">
          <AppIcon name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Tag</Text>
        </Pressable>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : tags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AppIcon name="pricetag-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No tags yet</Text>
            <Text style={styles.emptySubtext}>Create your first tag to organize content</Text>
          </View>
        ) : (
          <FlatList
            data={tags}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#22409a"
                colors={['#22409a']}
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
                <View style={styles.tagContent}>
                  <AppIcon name="pricetag" size={20} color="#22409a" />
                  <Text style={styles.tagName}>{item.name}</Text>
                </View>
                <View style={styles.tagMeta}>
                  <Text style={styles.tagCount}>{item.count}</Text>
                  <AppIcon name="chevron-forward" size={16} color="#94a3b8" />
                </View>
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
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#dfe9ff',
  },
  container: { flex: 1, padding: 16, gap: 16 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22409a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  tagCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#edf1fa',
    shadowColor: '#22409a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d2f5f',
  },
  tagMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22409a',
    backgroundColor: '#eef4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  error: {
    marginTop: 16,
    color: '#d14f46',
    paddingHorizontal: 20,
    fontWeight: '600',
  },
});
