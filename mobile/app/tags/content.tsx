import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { TypeContentCard } from '@/components/TypeContentCard';
import { getContentByTag } from '@/api/tags';
import { useDataSync } from '@/lib/dataSync';
import { colors } from '@/theme/colors';
import type { ItemType } from '@/theme/typeColors';

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

  async function load() {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const content = await getContentByTag(name);
      const allItems: ContentItem[] = [];

      if (content.items && Array.isArray(content.items)) {
        content.items.forEach((item: any) => {
          allItems.push({ kind: item.kind || 'blog', item });
        });
      }

      setItems(allItems);
    } catch (err) {
      console.error('[Tag Content] Failed to load content:', err);
      setError('Could not load content');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [name]);

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
    }
  };

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
        <View style={styles.titleContainer}>
          <View style={styles.tagBadge}>
            <AppIcon name="pricetag" size={12} color="#fff" />
            <Text style={styles.tagBadgeText}>Tag</Text>
          </View>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading…' : `${items.length} item${items.length === 1 ? '' : 's'}`}
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading content…</Text>
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <AppIcon name="document-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>Nothing tagged yet</Text>
            <Text style={styles.emptySubtext}>
              Add “{name}” when creating notes, links, blogs, or PDFs.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(entry, index) => `${entry.kind}-${entry.item.id}-${index}`}
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
              <TypeContentCard
                type={item.kind as ItemType}
                title={item.item.title}
                meta={
                  item.kind === 'link'
                    ? item.item.url
                    : item.kind === 'pdf'
                      ? item.item.description || 'Uploaded PDF'
                      : 'Saved to your library'
                }
                onPress={() => void openItem(item)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.note.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  container: { flex: 1 },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
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
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.note.soft,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    marginTop: 16,
    color: colors.error,
    paddingHorizontal: 20,
    fontWeight: '700',
  },
});
