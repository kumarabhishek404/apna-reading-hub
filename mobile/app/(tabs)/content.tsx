import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { deleteNote, getNotes } from '@/api/notes';
import { deleteBlog, getBlogs } from '@/api/blogs';
import { deleteLink, getLinks } from '@/api/links';
import { deletePdf, getPdfs } from '@/api/pdfs';
import { getReminders } from '@/api/reminders';
import { getTags } from '@/api/tags';
import { API_BASE_URL } from '@/config/env';
import { ActionMenu } from '@/components/ActionMenu';
import { AppIcon } from '@/components/AppIcon';
import { useToast } from '@/components/ToastContext';
import { dataSyncManager, useDataSync } from '@/lib/dataSync';
import { ModernHeader } from '@/components/ModernHeader';
import { AnimatedCard } from '@/components/AnimatedCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { FadeInListItem } from '@/components/AnimatedFlatList';
import { OfflineStatusCompact } from '@/components/OfflineStatus';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme/colors';
import { noteRepository } from '@/lib/offlineRepositories/noteOfflineRepository';
import { noteOfflineRepository as genericNoteRepo } from '@/lib/offlineRepositories/genericOfflineRepository';
import { networkMonitor } from '@/lib/networkMonitor';
import type { BlogItem, LinkItem, NoteItem, PdfItem, ReminderItem } from '@/types';

type ContentItem =
  | ({ kind: 'note'; item: NoteItem })
  | ({ kind: 'blog'; item: BlogItem })
  | ({ kind: 'link'; item: LinkItem })
  | ({ kind: 'pdf'; item: PdfItem })
  | ({ kind: 'reminder'; item: ReminderItem });

type FilterType = 'all' | 'note' | 'blog' | 'link' | 'pdf' | 'reminder';
type TimeFilter = 'all' | 'monthly' | 'yearly';

export default function ContentScreen() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string; count: number }[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<FilterType[]>(['all']);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { showInfo, showSuccess, showError } = useToast();

  async function load() {
    console.log('[Content] Loading data from database');
    try {
      // Try to load from server first
      const [notesRes, blogsRes, linksRes, pdfsRes, remindersRes] = await Promise.all([
        getNotes(),
        getBlogs(),
        getLinks(),
        getPdfs(),
        getReminders(),
      ]);

      const combined: ContentItem[] = [
        ...notesRes.notes.map((item) => ({ kind: 'note' as const, item })),
        ...blogsRes.blogs.map((item) => ({ kind: 'blog' as const, item })),
        ...linksRes.links.map((item) => ({ kind: 'link' as const, item })),
        ...pdfsRes.pdfs.map((item) => ({ kind: 'pdf' as const, item })),
        ...remindersRes.reminders.map((item) => ({ kind: 'reminder' as const, item })),
      ];

      // Sort by createdAt descending
      combined.sort((a, b) => {
        const dateA = new Date(a.item.createdAt).getTime();
        const dateB = new Date(b.item.createdAt).getTime();
        return dateB - dateA;
      });

      setItems(combined);
      // Apply current filter to the loaded items
      if (selectedTypes.includes('all')) {
        setFilteredItems(combined);
      } else {
        setFilteredItems(combined.filter((item) => selectedTypes.includes(item.kind)));
      }
      setError(null);
      console.log('[Content] Data loaded successfully from server', { total: combined.length });
    } catch (err) {
      console.error('[Content] Failed to load from server, trying offline storage', err);
      
      // Fallback to offline storage
      try {
        const offlineNotes = await genericNoteRepo.getAllEntities('note');
        const offlineItems: ContentItem[] = [
          ...offlineNotes.map((item) => ({ kind: 'note' as const, item: item as any })),
        ];

        // Apply current filter to the loaded items
        if (selectedTypes.includes('all')) {
          setFilteredItems(offlineItems);
        } else {
          setFilteredItems(offlineItems.filter((item) => selectedTypes.includes(item.kind)));
        }
        setItems(offlineItems);
        setError(null);
        console.log('[Content] Data loaded from offline storage', { total: offlineItems.length });
      } catch (offlineErr) {
        console.error('[Content] Failed to load from offline storage', offlineErr);
        setError('Could not load library items');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleTypeToggle(type: FilterType) {
    setSelectedTypes((prev) => {
      if (type === 'all') {
        // If selecting "all", clear other selections
        return ['all'];
      }
      
      if (prev.includes('all')) {
        // If "all" was selected and now selecting a specific type, remove "all"
        return [type];
      }
      
      if (prev.includes(type)) {
        // If already selected, remove it
        const newTypes = prev.filter((t) => t !== type);
        // If no types selected, default to "all"
        return newTypes.length > 0 ? newTypes : ['all'];
      }
      
      // Add the new type
      return [...prev, type];
    });
  }

  function handleTimeFilterChange(newTimeFilter: TimeFilter) {
    setTimeFilter(newTimeFilter);
  }

  function handleTagChange(tagId: string | null) {
    setSelectedTag(tagId);
  }

  function applyAllFilters() {
    let filtered = [...items];

    // Apply type filter (multiple types supported)
    if (!selectedTypes.includes('all')) {
      filtered = filtered.filter((item) => selectedTypes.includes(item.kind));
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      if (timeFilter === 'monthly') {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (timeFilter === 'yearly') {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }
      filtered = filtered.filter((item) => new Date(item.item.createdAt) >= cutoffDate);
    }

    // Apply tag filter (if tags are implemented on items)
    if (selectedTag) {
      // Filter by tag when tag data is available on items
      // For now, this is a placeholder - you'll need to ensure items have tag data
    }

    setFilteredItems(filtered);
  }

  function resetFilters() {
    setSelectedTypes(['all']);
    setTimeFilter('all');
    setSelectedTag(null);
    setFilteredItems(items);
  }

  async function loadTags() {
    setTagsLoading(true);
    try {
      const res = await getTags();
      setTags(res.tags || []);
    } catch (err) {
      console.error('[Content] Failed to load tags', err);
    } finally {
      setTagsLoading(false);
    }
  }

  useEffect(() => {
    if (filterModalVisible) {
      loadTags();
    }
  }, [filterModalVisible]);

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
        case 'reminder':
          router.push(`/reminders/edit?id=${entry.item.id}`);
          return;
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
        onPress: () => {
          if (entry.kind === 'reminder') {
            router.push(`/reminders/edit?id=${entry.item.id}`);
          } else {
            router.push(`/${entry.kind}s/edit?id=${entry.item.id}`);
          }
        },
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
      case 'reminder': return 'Reminder';
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

    if (entry.kind === 'reminder') {
      router.push(`/reminders/edit?id=${entry.item.id}`);
      return;
    }

    if (entry.kind === 'note') {
      router.push(`/notes/edit?id=${entry.item.id}`);
      return;
    }

    showInfo('Open this item from your library.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Library</Text>
          <Text style={styles.screenSubtitle}>Notes, links, blogs, PDFs, and reminders</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <AppIcon name="funnel-outline" size={20} color={colors.primary} />
          </Pressable>
          <OfflineStatusCompact />
        </View>
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
        <Link href="/reminders/create" asChild>
          <Pressable style={styles.createButton}><Text style={styles.createButtonText}>+ Reminder</Text></Pressable>
        </Link>
        <Pressable 
          style={styles.tagsButton}
          onPress={() => {
            loadTags();
            setTagsModalVisible(true);
          }}
        >
          <AppIcon name="pricetag" size={18} color="#fff" />
        </Pressable>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filteredItems}
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
                    <AppIcon name={action.icon as any} size={16} color={action.color} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />
      )}

      {/* Tags Modal */}
      <Modal
        visible={tagsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTagsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Tags</Text>
              <Pressable onPress={() => setTagsModalVisible(false)}>
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            
            {tagsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : tags.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AppIcon name="pricetag-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No tags yet</Text>
                <Text style={styles.emptySubtext}>Add tags when creating content</Text>
              </View>
            ) : (
              <ScrollView style={styles.tagsList}>
                {tags.map((tag) => (
                  <Pressable
                    key={tag.id}
                    style={styles.tagItem}
                    onPress={() => {
                      setTagsModalVisible(false);
                      router.push(`/tags/content?name=${encodeURIComponent(tag.name)}`);
                    }}
                  >
                    <Text style={styles.tagName}>{tag.name}</Text>
                    <Text style={styles.tagCount}>{tag.count} items</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.manageTagsButton}
                onPress={() => {
                  setTagsModalVisible(false);
                  router.push('/tags');
                }}
              >
                <Text style={styles.manageTagsButtonText}>Manage All Tags</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Library</Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={styles.filterScrollContainer}>
              <ScrollView style={styles.filterList} contentContainerStyle={styles.filterListContent}>
                <Text style={styles.filterSectionTitle}>Type</Text>
                <Pressable
                  style={[styles.filterItem, selectedTypes.includes('all') && styles.filterItemActive]}
                  onPress={() => handleTypeToggle('all')}
                >
                  <Text style={[styles.filterItemText, selectedTypes.includes('all') && styles.filterItemTextActive]}>All Items</Text>
                  {selectedTypes.includes('all') && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  style={[styles.filterItem, selectedTypes.includes('note') && styles.filterItemActive]}
                  onPress={() => handleTypeToggle('note')}
                >
                  <Text style={[styles.filterItemText, selectedTypes.includes('note') && styles.filterItemTextActive]}>Notes</Text>
                  {selectedTypes.includes('note') && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  style={[styles.filterItem, selectedTypes.includes('blog') && styles.filterItemActive]}
                  onPress={() => handleTypeToggle('blog')}
                >
                  <Text style={[styles.filterItemText, selectedTypes.includes('blog') && styles.filterItemTextActive]}>Blogs</Text>
                  {selectedTypes.includes('blog') && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  style={[styles.filterItem, selectedTypes.includes('link') && styles.filterItemActive]}
                  onPress={() => handleTypeToggle('link')}
                >
                  <Text style={[styles.filterItemText, selectedTypes.includes('link') && styles.filterItemTextActive]}>Links</Text>
                  {selectedTypes.includes('link') && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  style={[styles.filterItem, selectedTypes.includes('pdf') && styles.filterItemActive]}
                  onPress={() => handleTypeToggle('pdf')}
                >
                  <Text style={[styles.filterItemText, selectedTypes.includes('pdf') && styles.filterItemTextActive]}>PDFs</Text>
                  {selectedTypes.includes('pdf') && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  style={[styles.filterItem, selectedTypes.includes('reminder') && styles.filterItemActive]}
                  onPress={() => handleTypeToggle('reminder')}
                >
                  <Text style={[styles.filterItemText, selectedTypes.includes('reminder') && styles.filterItemTextActive]}>Reminders</Text>
                  {selectedTypes.includes('reminder') && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>

                <Text style={styles.filterSectionTitle}>Time Period</Text>
                <Pressable
                  style={[styles.filterItem, timeFilter === 'all' && styles.filterItemActive]}
                  onPress={() => handleTimeFilterChange('all')}
                >
                  <Text style={[styles.filterItemText, timeFilter === 'all' && styles.filterItemTextActive]}>All Time</Text>
                  {timeFilter === 'all' && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  style={[styles.filterItem, timeFilter === 'monthly' && styles.filterItemActive]}
                  onPress={() => handleTimeFilterChange('monthly')}
                >
                  <Text style={[styles.filterItemText, timeFilter === 'monthly' && styles.filterItemTextActive]}>Last Month</Text>
                  {timeFilter === 'monthly' && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  style={[styles.filterItem, timeFilter === 'yearly' && styles.filterItemActive]}
                  onPress={() => handleTimeFilterChange('yearly')}
                >
                  <Text style={[styles.filterItemText, timeFilter === 'yearly' && styles.filterItemTextActive]}>Last Year</Text>
                  {timeFilter === 'yearly' && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>

                <Text style={styles.filterSectionTitle}>Tags</Text>
                <Pressable
                  style={[styles.filterItem, selectedTag === null && styles.filterItemActive]}
                  onPress={() => handleTagChange(null)}
                >
                  <Text style={[styles.filterItemText, selectedTag === null && styles.filterItemTextActive]}>All Tags</Text>
                  {selectedTag === null && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                </Pressable>
                {tags.map((tag) => (
                  <Pressable
                    key={tag.id}
                    style={[styles.filterItem, selectedTag === tag.id && styles.filterItemActive]}
                    onPress={() => handleTagChange(tag.id)}
                  >
                    <Text style={[styles.filterItemText, selectedTag === tag.id && styles.filterItemTextActive]}>{tag.name}</Text>
                    {selectedTag === tag.id && <AppIcon name="checkmark-circle" size={20} color={colors.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterModalFooter}>
              <Pressable
                style={styles.resetButton}
                onPress={() => {
                  resetFilters();
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
              <Pressable
                style={styles.applyButton}
                onPress={() => {
                  applyAllFilters();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.applyButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 4, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  createButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 0,
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
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
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
    borderLeftColor: colors.borderLight,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  tagsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  error: { marginTop: 16, color: colors.error, paddingHorizontal: 20, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  filterScrollContainer: {
    flex: 1,
    minHeight: 0,
  },
  filterList: {
    flex: 1,
  },
  filterListContent: {
    paddingBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  tagsList: {
    flex: 1,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tagCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modalFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  manageTagsButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  manageTagsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterItemActive: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  filterItemTextActive: {
    color: colors.primary,
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
