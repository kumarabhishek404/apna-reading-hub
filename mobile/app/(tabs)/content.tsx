import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/api/client';
import { API_BASE_URL } from '@/config/env';
import type { BlogItem, LinkItem, NoteItem, PdfItem } from '@/types';

type ContentItem =
  | ({ kind: 'note'; item: NoteItem })
  | ({ kind: 'blog'; item: BlogItem })
  | ({ kind: 'link'; item: LinkItem })
  | ({ kind: 'pdf'; item: PdfItem });

export default function ContentScreen() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [notesRes, blogsRes, linksRes, pdfsRes] = await Promise.all([
          apiClient.get<{ notes: NoteItem[] }>('/api/notes'),
          apiClient.get<{ blogs: BlogItem[] }>('/api/blogs'),
          apiClient.get<{ links: LinkItem[] }>('/api/links'),
          apiClient.get<{ pdfs: PdfItem[] }>('/api/pdfs'),
        ]);

        const combined: ContentItem[] = [
          ...notesRes.notes.map((item) => ({ kind: 'note' as const, item })),
          ...blogsRes.blogs.map((item) => ({ kind: 'blog' as const, item })),
          ...linksRes.links.map((item) => ({ kind: 'link' as const, item })),
          ...pdfsRes.pdfs.map((item) => ({ kind: 'pdf' as const, item })),
        ];

        setItems(combined);
      } catch {
        setError('Could not load library items');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

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

    if (entry.kind === 'blog' && entry.item.url) {
      const url = entry.item.url.startsWith('http') ? entry.item.url : `https://${entry.item.url}`;
      await Linking.openURL(url);
      return;
    }

    if (entry.kind === 'pdf') {
      const url = `${API_BASE_URL}${entry.item.pdfUrl}`;
      await Linking.openURL(url);
      return;
    }

    Alert.alert(entry.item.title, entry.kind === 'note' ? entry.item.content || 'No content yet.' : 'Open this item from your library.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>Notes, links, blogs, and PDFs from your hub</Text>
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
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => void openItem(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardKind}>{renderLabel(item.kind)}</Text>
                <Text style={styles.cardTitle}>{item.item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.kind === 'link' ? item.item.url : item.kind === 'pdf' ? item.item.description : 'Saved to your library'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7ff' },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  cardKind: { fontSize: 11, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  error: { marginTop: 16, color: '#b91c1c', paddingHorizontal: 20 },
});
