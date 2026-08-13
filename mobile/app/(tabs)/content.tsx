import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { deleteNote, getNotes } from '@/api/notes';
import { deleteBlog, getBlogs } from '@/api/blogs';
import { deleteLink, getLinks } from '@/api/links';
import { deletePdf, getPdfs } from '@/api/pdfs';
import { API_BASE_URL } from '@/config/env';
import { ActionMenu } from '@/components/ActionMenu';
import { AppIcon } from '@/components/AppIcon';
import { BrandHeader } from '@/components/BrandHeader';
import { useToast } from '@/components/ToastContext';
import { dataSyncManager, useDataSync } from '@/lib/dataSync';
import { ModernHeader } from '@/components/ModernHeader';
import { AnimatedCard } from '@/components/AnimatedCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { FadeInListItem } from '@/components/AnimatedFlatList';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme/colors';
import type { BlogItem, LinkItem, NoteItem, PdfItem } from '@/types';

type ContentItem =
  | ({ kind: 'note'; item: NoteItem })
  | ({ kind: 'blog'; item: BlogItem })
  | ({ kind: 'link'; item: LinkItem })
  | ({ kind: 'pdf'; item: PdfItem });

export default function ContentScreen() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showInfo, showSuccess, showError } = useToast();

  async function load() {
    console.log('[Content] Loading data from database');
    try {
      const [notesRes, blogsRes, linksRes, pdfsRes] = await Promise.all([
        getNotes(),
        getBlogs(),
        getLinks(),
        getPdfs(),
      ]);

      const combined: ContentItem[] = [
        ...notesRes.notes.map((item) => ({ kind: 'note' as const, item })),
        ...blogsRes.blogs.map((item) => ({ kind: 'blog' as const, item })),
        ...linksRes.links.map((item) => ({ kind: 'link' as const, item })),
        ...pdfsRes.pdfs.map((item) => ({ kind: 'pdf' as const, item })),
      ];

      // Sort by createdAt descending
      combined.sort((a, b) => {
        const dateA = new Date(a.item.createdAt).getTime();
        const dateB = new Date(b.item.createdAt).getTime();
        return dateB - dateA;
      });

      setItems(combined);
      setError(null);
      console.log('[Content] Data loaded successfully', { total: combined.length });
    } catch (err) {
      console.error('[Content] Failed to load data:', err);
      setError('Could not load library items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, []);

  useEffect(() => {
    void load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [])
  );

  // Auto-sync data when app comes to foreground or periodically
  useDataSync(load, { immediate: false, interval: 45000 });

  async function deleteItem(entry: ContentItem) {
    try {
      switch (entry.kind) {
        case 'note':
          await deleteNote(entry.item.id);
          break;
        case 'blog':
          await deleteBlog(entry.item.id);
          break;
        case 'link':
          await deleteLink(entry.item.id);
          break;
        case 'pdf':
          await deletePdf(entry.item.id);
          break;
      }
      showSuccess(`${entry.kind.charAt(0).toUpperCase() + entry.kind.slice(1)} deleted successfully`);
      void load();
    } catch {
      showError(`Could not delete ${entry.kind}`);
    }
  }

  const getItemActions = (entry: ContentItem) => {
    const actions = [
      {
        icon: 'create-outline',
        color: '#22409a',
        onPress: () => router.push(`/${entry.kind}s/edit?id=${entry.item.id}`),
        accessibilityLabel: `Edit ${entry.kind}`,
      },
      {
        icon: 'trash-outline',
        color: '#ef4444',
        onPress: () => deleteItem(entry),
        accessibilityLabel: `Delete ${entry.kind}`,
      },
    ];

    if (entry.kind !== 'note') {
      actions.splice(1, 0, {
        icon: 'alarm-outline',
        color: '#22409a',
        onPress: () => router.push(`/reminders/create?linkedId=${entry.item.id}&linkedType=${entry.kind}`),
        accessibilityLabel: `Add reminder to ${entry.kind}`,
      });
    }

    return actions;
  };

  function renderLabel(kind: ContentItem['kind']) {
    switch (kind) {
      case 'note': return 'Note';
      case 'blog': return 'Blog';
      case 'link': return 'Link';
      case 'pdf': return 'PDF';
    }
  }

  async function openItem(entry: ContentItem) {
    if (entry.kind === 'link') {
      const url = entry.item.url.startsWith('http') ? entry.item.url : `https://${entry.item.url}`;
      await Linking.openURL(url);
      return;
    }

    if (entry.kind === 'blog') {
      if (entry.item.url) {
        const url = entry.item.url.startsWith('http') ? entry.item.url : `https://${entry.item.url}`;
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

    showInfo(entry.kind === 'note' ? entry.item.content || 'No content yet.' : 'Open this item from your library.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BrandHeader title="Library" subtitle="Notes, links, blogs, and PDFs" />
      </View>
      
      <View style={styles.createButtons}>
        <Link href="/notes/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ Note</Text></Pressable>
        </Link>
        <Link href="/blogs/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ Blog</Text></Pressable>
        </Link>
        <Link href="/links/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ Link</Text></Pressable>
        </Link>
        <Link href="/pdfs/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ PDF</Text></Pressable>
        </Link>
        <Link href="/tags" asChild>
          <Pressable style={styles.tagsButton}><AppIcon name="pricetag" size={18} color="#fff" /></Pressable>
        </Link>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
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
            <View style={styles.card}>
              <Pressable 
                style={{ flex: 1 }} 
                onPress={() => void openItem(item)}
              >
                <Text style={styles.cardKind}>{renderLabel(item.kind)}</Text>
                <Text style={styles.cardTitle}>{item.item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.kind === 'link' ? item.item.url : item.kind === 'pdf' ? (item.item.description || 'Uploaded PDF') : 'Saved to your library'}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                {getItemActions(item).map((action, index) => (
                  <Pressable
                    key={index}
                    style={styles.actionButton}
                    onPress={action.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={action.accessibilityLabel}
                  >
                    <AppIcon name={action.icon} size={16} color={action.color} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1d2f5f', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  createButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 10,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#edf1fa',
    shadowColor: '#22409a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardKind: { fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  cardMeta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#edf1fa',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  tagsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  error: { marginTop: 16, color: '#d14f46', paddingHorizontal: 20, fontWeight: '600' },
});
