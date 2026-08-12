import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { getNotes } from '@/api/notes';
import { getBlogs } from '@/api/blogs';
import { getLinks } from '@/api/links';
import { getPdfs } from '@/api/pdfs';
import { API_BASE_URL } from '@/config/env';
import { BrandHeader } from '@/components/BrandHeader';
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
    backgroundColor: '#22409a',
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
  cardKind: { fontSize: 11, fontWeight: '800', color: '#ff8a00', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1d2f5f', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 6 },
  error: { marginTop: 16, color: '#d14f46', paddingHorizontal: 20, fontWeight: '600' },
});
