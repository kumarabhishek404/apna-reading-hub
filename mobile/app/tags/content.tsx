import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { getContentByTag, type TagItem } from '@/api/tags';
import { getBlogs } from '@/api/blogs';
import { getLinks } from '@/api/links';
import { getPdfs } from '@/api/pdfs';
import { getNotes } from '@/api/notes';
import { useToast } from '@/components/ToastContext';
import { useDataSync } from '@/lib/dataSync';

type ContentItem = {
  kind: 'blog' | 'link' | 'pdf' | 'note';
  item: any;
};

export default function TagContentScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  async function load() {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      console.log('[Tag Content] Loading content for tag:', name);
      const content = await getContentByTag(name);
      console.log('[Tag Content] Received content:', content);
      
      const allItems: ContentItem[] = [];

      // Add blogs
      if (content.items && Array.isArray(content.items)) {
        content.items.forEach((item: any) => {
          allItems.push({ kind: item.kind || 'blog', item });
        });
      }

      console.log('[Tag Content] Total items:', allItems.length);
      setItems(allItems);
    } catch (err) {
      console.error('[Tag Content] Failed to load content:', err);
      setError('Could not load content');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [name]);

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
    router.replace('/tags');
  };

  const openItem = async (entry: ContentItem) => {
    if (entry.kind === 'link') {
      const url = entry.item.url.startsWith('http') 
        ? entry.item.url 
        : `https://${entry.item.url}`;
      await Linking.openURL(url);
      return;
    }

    if (entry.kind === 'blog') {
      if (entry.item.url) {
        const url = entry.item.url.startsWith('http') 
          ? entry.item.url 
          : `https://${entry.item.url}`;
        await Linking.openURL(url);
      } else {
        router.push(`/blogs/read?id=${entry.item.id}`);
      }
      return;
    }

    if (entry.kind === 'pdf') {
      router.push(`/pdfs/view?id=${entry.item.id}`);
      return;
    }

    if (entry.kind === 'note') {
      router.push(`/notes/edit?id=${entry.item.id}`);
      return;
    }
  };

  const renderLabel = (kind: string) => {
    const labels = {
      note: 'NOTE',
      blog: 'BLOG',
      link: 'LINK',
      pdf: 'PDF',
    };
    return labels[kind as keyof typeof labels] || kind.toUpperCase();
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
          <Text style={styles.loadingText}>Loading content...</Text>
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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>{items.length} items</Text>
        </View>
      </View>

      <View style={styles.container}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AppIcon name="document-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No content tagged with "{name}"</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(entry, index) => `${entry.kind}-${entry.item.id}-${index}`}
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
                style={styles.card} 
                onPress={() => openItem(item)}
              >
                <Text style={styles.cardKind}>{renderLabel(item.kind)}</Text>
                <Text style={styles.cardTitle}>{item.item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.kind === 'link' ? item.item.url : 
                   item.kind === 'pdf' ? item.item.description || 'Uploaded PDF' : 
                   'Saved to your library'}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d2f5f',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#edf1fa',
    shadowColor: '#22409a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardKind: { fontSize: 11, fontWeight: '800', color: '#ff8a00', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1d2f5f', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 6 },
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
    fontSize: 16,
    color: '#64748b',
  },
  error: {
    marginTop: 16,
    color: '#d14f46',
    paddingHorizontal: 20,
    fontWeight: '600',
  },
});
