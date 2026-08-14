import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
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
import { TypeContentCard } from '@/components/TypeContentCard';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme/colors';
import { useTabContentPaddingBottom } from '@/theme/layout';
import { getTypeTheme } from '@/theme/typeColors';
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
  // Draft selections inside the popup — applied only when user taps Done.
  const [draftTypes, setDraftTypes] = useState<FilterType[]>(['all']);
  const [draftTimeFilter, setDraftTimeFilter] = useState<TimeFilter>('all');
  const [draftTag, setDraftTag] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { showInfo, showSuccess, showError } = useToast();
  const tabPaddingBottom = useTabContentPaddingBottom();

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
      applyFilters(selectedTypes, timeFilter, selectedTag, combined);
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

        setItems(offlineItems);
        applyFilters(selectedTypes, timeFilter, selectedTag, offlineItems);
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
    setDraftTypes((prev) => {
      if (type === 'all') {
        return ['all'];
      }

      const withoutAll = prev.filter((t) => t !== 'all');

      if (withoutAll.includes(type)) {
        const next = withoutAll.filter((t) => t !== type);
        return next.length > 0 ? next : ['all'];
      }

      return [...withoutAll, type];
    });
  }

  function handleTimeFilterChange(newTimeFilter: TimeFilter) {
    setDraftTimeFilter(newTimeFilter);
  }

  function handleTagChange(tagId: string | null) {
    setDraftTag(tagId);
  }

  function applyFilters(
    types: FilterType[] = selectedTypes,
    time: TimeFilter = timeFilter,
    tag: string | null = selectedTag,
    sourceItems: ContentItem[] = items,
  ) {
    let filtered = [...sourceItems];

    if (!types.includes('all')) {
      filtered = filtered.filter((item) => types.includes(item.kind));
    }

    if (time !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      if (time === 'monthly') {
        cutoffDate.setMonth(now.getMonth() - 1);
      } else if (time === 'yearly') {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      }
      filtered = filtered.filter((item) => new Date(item.item.createdAt) >= cutoffDate);
    }

    if (tag) {
      // Tag filtering is handled when tag metadata is available on items.
    }

    setFilteredItems(filtered);
  }

  function openFilterModal() {
    setDraftTypes(selectedTypes);
    setDraftTimeFilter(timeFilter);
    setDraftTag(selectedTag);
    setFilterModalVisible(true);
  }

  function closeFilterModalWithoutApplying() {
    setFilterModalVisible(false);
  }

  function resetDraftFilters() {
    setDraftTypes(['all']);
    setDraftTimeFilter('all');
    setDraftTag(null);
  }

  function applyDraftFiltersAndClose() {
    setSelectedTypes(draftTypes);
    setTimeFilter(draftTimeFilter);
    setSelectedTag(draftTag);
    applyFilters(draftTypes, draftTimeFilter, draftTag, items);
    setFilterModalVisible(false);
  }

  function resetFilters() {
    setSelectedTypes(['all']);
    setTimeFilter('all');
    setSelectedTag(null);
    setDraftTypes(['all']);
    setDraftTimeFilter('all');
    setDraftTag(null);
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
    const typeTheme = getTypeTheme(entry.kind);
    const actions = [
      {
        icon: 'create-outline',
        color: typeTheme.primary,
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
        color: colors.error,
        onPress: () => deleteItem(entry),
        accessibilityLabel: `Delete ${entry.kind}`,
      },
    ];

    return actions;
  };

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
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.screenTitle}>Library</Text>
          <Text style={styles.screenSubtitle}>Notes, links, blogs, PDFs, and reminders</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.filterButton} onPress={openFilterModal}>
            <AppIcon name="funnel-outline" size={20} color={colors.primary} />
          </Pressable>
          <OfflineStatusCompact />
        </View>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.createButtonsScroll}
        contentContainerStyle={styles.createButtons}
      >
        {(
          [
            { type: 'note' as const, label: 'Note', href: '/notes/create', icon: 'document-text-outline' as const },
            { type: 'blog' as const, label: 'Blog', href: '/blogs/create', icon: 'newspaper-outline' as const },
            { type: 'link' as const, label: 'Link', href: '/links/create', icon: 'link-outline' as const },
            { type: 'pdf' as const, label: 'PDF', href: '/pdfs/create', icon: 'document-outline' as const },
            { type: 'reminder' as const, label: 'Reminder', href: '/reminders/create', icon: 'notifications-outline' as const },
          ] as const
        ).map((option) => {
          const theme = getTypeTheme(option.type);
          return (
            <Pressable
              key={option.type}
              style={[
                styles.createButton,
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.dark,
                },
              ]}
              onPress={() => router.push(option.href as any)}
              accessibilityRole="button"
              accessibilityLabel={`Create ${option.label}`}
            >
              <AppIcon name={option.icon} size={16} color="#fff" />
              <Text style={styles.createButtonText}>{option.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.tagsButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            loadTags();
            setTagsModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Open tags"
        >
          <AppIcon name="pricetag" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
      
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(entry, index) => `${entry.kind}-${entry.item.id}-${index}`}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: tabPaddingBottom }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const typeTheme = getTypeTheme(item.kind);
            const meta =
              item.kind === 'link'
                ? item.item.url
                : item.kind === 'pdf'
                  ? item.item.description || 'Uploaded PDF'
                  : 'Saved to your library';

            return (
              <TypeContentCard
                type={item.kind}
                title={item.item.title}
                meta={meta}
                onPress={
                  item.kind === 'blog' || item.kind === 'pdf' || item.kind === 'link'
                    ? () => void openItem(item)
                    : undefined
                }
                actions={getItemActions(item).map((action, index) => (
                  <Pressable
                    key={index}
                    style={[styles.actionButton, { backgroundColor: typeTheme.muted }]}
                    onPress={action.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={action.accessibilityLabel}
                  >
                    <AppIcon name={action.icon as any} size={16} color={action.color} />
                  </Pressable>
                ))}
              />
            );
          }}
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
          <Pressable style={styles.modalDismissArea} onPress={() => setTagsModalVisible(false)} />
          <View style={styles.tagsSheet}>
            <View style={styles.tagsSheetHeader}>
              <View style={styles.tagsSheetTitleBlock}>
                <Text style={styles.tagsSheetTitle}>All Tags</Text>
                <Text style={styles.tagsSheetSubtitle}>
                  {tagsLoading
                    ? 'Loading…'
                    : tags.length === 0
                      ? 'No tags yet'
                      : `${tags.length} tag${tags.length === 1 ? '' : 's'}`}
                </Text>
              </View>
              <Pressable
                style={styles.tagsCloseButton}
                onPress={() => setTagsModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close tags"
              >
                <AppIcon name="close" size={20} color={colors.primary} />
              </Pressable>
            </View>

            {tagsLoading ? (
              <View style={styles.tagsEmptyState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.emptySubtext}>Loading tags…</Text>
              </View>
            ) : tags.length === 0 ? (
              <View style={styles.tagsEmptyState}>
                <View style={styles.tagsEmptyIcon}>
                  <AppIcon name="pricetag-outline" size={36} color={colors.primary} />
                </View>
                <Text style={styles.emptyText}>No tags yet</Text>
                <Text style={styles.emptySubtext}>
                  Create tags while adding notes, links, blogs, or PDFs.
                </Text>
                <Pressable
                  style={styles.tagsPrimaryButton}
                  onPress={() => {
                    setTagsModalVisible(false);
                    router.push('/tags/create');
                  }}
                >
                  <AppIcon name="add" size={18} color="#fff" />
                  <Text style={styles.tagsPrimaryButtonText}>Create tag</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                style={styles.tagsList}
                contentContainerStyle={styles.tagsListContent}
                showsVerticalScrollIndicator={false}
              >
                {tags.map((tag) => (
                  <Pressable
                    key={tag.id}
                    style={styles.tagItem}
                    onPress={() => {
                      setTagsModalVisible(false);
                      router.push(`/tags/content?name=${encodeURIComponent(tag.name)}`);
                    }}
                  >
                    <View style={styles.tagItemIcon}>
                      <AppIcon name="pricetag" size={16} color="#fff" />
                    </View>
                    <View style={styles.tagItemCopy}>
                      <Text style={styles.tagName}>{tag.name}</Text>
                      <Text style={styles.tagCount}>
                        {tag.count} item{tag.count === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <AppIcon name="chevron-forward" size={16} color={colors.primary} />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={styles.tagsSheetFooter}>
              <Pressable
                style={styles.manageTagsButton}
                onPress={() => {
                  setTagsModalVisible(false);
                  router.push('/tags');
                }}
              >
                <AppIcon name="options-outline" size={18} color="#fff" />
                <Text style={styles.manageTagsButtonText}>Manage tags</Text>
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
        onRequestClose={closeFilterModalWithoutApplying}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={closeFilterModalWithoutApplying} />
          <View style={styles.filterSheet}>
            <View style={styles.filterSheetHeader}>
              <View style={styles.filterSheetTitleBlock}>
                <Text style={styles.filterSheetTitle}>Filter Library</Text>
                <Text style={styles.filterSheetSubtitle}>
                  Choose types, time, and tags — then tap Done
                </Text>
              </View>
              <Pressable
                style={styles.filterCloseButton}
                onPress={closeFilterModalWithoutApplying}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
              >
                <AppIcon name="close" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.filterList}
              contentContainerStyle={styles.filterListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.filterSectionTitle}>Type</Text>
              <Text style={styles.filterHint}>Select one or more types</Text>
              {(
                [
                  {
                    key: 'all' as const,
                    label: 'All Items',
                    icon: 'apps-outline' as const,
                    muted: colors.primaryMuted,
                    soft: colors.note.soft,
                    accent: colors.primary,
                    dark: colors.primaryDark,
                  },
                  {
                    key: 'note' as const,
                    label: 'Notes',
                    icon: 'document-text-outline' as const,
                    muted: colors.note.muted,
                    soft: colors.note.soft,
                    accent: colors.note.primary,
                    dark: colors.note.dark,
                  },
                  {
                    key: 'blog' as const,
                    label: 'Blogs',
                    icon: 'newspaper-outline' as const,
                    muted: colors.blog.muted,
                    soft: colors.blog.soft,
                    accent: colors.blog.primary,
                    dark: colors.blog.dark,
                  },
                  {
                    key: 'link' as const,
                    label: 'Links',
                    icon: 'link-outline' as const,
                    muted: colors.link.muted,
                    soft: colors.link.soft,
                    accent: colors.link.primary,
                    dark: colors.link.dark,
                  },
                  {
                    key: 'pdf' as const,
                    label: 'PDFs',
                    icon: 'document-outline' as const,
                    muted: colors.pdf.muted,
                    soft: colors.pdf.soft,
                    accent: colors.pdf.primary,
                    dark: colors.pdf.dark,
                  },
                  {
                    key: 'reminder' as const,
                    label: 'Reminders',
                    icon: 'notifications-outline' as const,
                    muted: colors.reminder.muted,
                    soft: colors.reminder.soft,
                    accent: colors.reminder.primary,
                    dark: colors.reminder.dark,
                  },
                ]
              ).map((option) => {
                const selected = draftTypes.includes(option.key);
                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.filterItem,
                      {
                        backgroundColor: selected ? option.muted : colors.surface,
                        borderColor: selected ? option.soft : colors.borderLight,
                      },
                    ]}
                    onPress={() => handleTypeToggle(option.key)}
                  >
                    <View style={[styles.filterItemIcon, { backgroundColor: option.accent }]}>
                      <AppIcon name={option.icon} size={16} color="#fff" />
                    </View>
                    <Text
                      style={[
                        styles.filterItemText,
                        { color: selected ? option.dark : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selected ? (
                      <AppIcon name="checkmark-circle" size={22} color={option.accent} />
                    ) : (
                      <View style={styles.filterItemRadio} />
                    )}
                  </Pressable>
                );
              })}

              <Text style={styles.filterSectionTitle}>Time Period</Text>
              <Text style={styles.filterHint}>Select one time range</Text>
              {(
                [
                  { key: 'all' as const, label: 'All Time', icon: 'infinite-outline' as const },
                  { key: 'monthly' as const, label: 'Last Month', icon: 'calendar-outline' as const },
                  { key: 'yearly' as const, label: 'Last Year', icon: 'calendar-number-outline' as const },
                ]
              ).map((option) => {
                const selected = draftTimeFilter === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.filterItem,
                      {
                        backgroundColor: selected ? colors.primaryMuted : colors.surface,
                        borderColor: selected ? colors.note.soft : colors.borderLight,
                      },
                    ]}
                    onPress={() => handleTimeFilterChange(option.key)}
                  >
                    <View
                      style={[
                        styles.filterItemIcon,
                        { backgroundColor: selected ? colors.primary : colors.textMuted },
                      ]}
                    >
                      <AppIcon name={option.icon} size={16} color="#fff" />
                    </View>
                    <Text
                      style={[
                        styles.filterItemText,
                        { color: selected ? colors.primaryDark : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selected ? (
                      <AppIcon name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <View style={styles.filterItemRadio} />
                    )}
                  </Pressable>
                );
              })}

              <Text style={styles.filterSectionTitle}>Tags</Text>
              <Text style={styles.filterHint}>Optional — pick one tag</Text>
              <Pressable
                style={[
                  styles.filterItem,
                  {
                    backgroundColor: draftTag === null ? colors.primaryMuted : colors.surface,
                    borderColor: draftTag === null ? colors.note.soft : colors.borderLight,
                  },
                ]}
                onPress={() => handleTagChange(null)}
              >
                <View
                  style={[
                    styles.filterItemIcon,
                    { backgroundColor: draftTag === null ? colors.primary : colors.textMuted },
                  ]}
                >
                  <AppIcon name="pricetags-outline" size={16} color="#fff" />
                </View>
                <Text
                  style={[
                    styles.filterItemText,
                    { color: draftTag === null ? colors.primaryDark : colors.text },
                  ]}
                >
                  All Tags
                </Text>
                {draftTag === null ? (
                  <AppIcon name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <View style={styles.filterItemRadio} />
                )}
              </Pressable>
              {tags.map((tag) => {
                const selected = draftTag === tag.id;
                return (
                  <Pressable
                    key={tag.id}
                    style={[
                      styles.filterItem,
                      {
                        backgroundColor: selected ? colors.primaryMuted : colors.surface,
                        borderColor: selected ? colors.note.soft : colors.borderLight,
                      },
                    ]}
                    onPress={() => handleTagChange(tag.id)}
                  >
                    <View
                      style={[
                        styles.filterItemIcon,
                        { backgroundColor: selected ? colors.primary : colors.textMuted },
                      ]}
                    >
                      <AppIcon name="pricetag" size={16} color="#fff" />
                    </View>
                    <Text
                      style={[
                        styles.filterItemText,
                        { color: selected ? colors.primaryDark : colors.text },
                      ]}
                    >
                      {tag.name}
                    </Text>
                    {selected ? (
                      <AppIcon name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <View style={styles.filterItemRadio} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <Pressable style={styles.resetButton} onPress={resetDraftFilters}>
                <AppIcon name="refresh-outline" size={16} color={colors.text} />
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={applyDraftFiltersAndClose}>
                <AppIcon name="checkmark" size={16} color="#fff" />
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
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
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
  createButtonsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginTop: 4,
    marginBottom: 4,
  },
  createButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  tagsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
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
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    flexDirection: 'column',
  },
  filterSheet: {
    backgroundColor: colors.note.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    height: '78%',
    flexDirection: 'column',
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  filterSheetTitleBlock: {
    flex: 1,
  },
  filterSheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.3,
  },
  filterSheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    lineHeight: 18,
  },
  filterCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  modalHeader: {
    marginBottom: 12,
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
    minHeight: 0,
  },
  filterListContent: {
    paddingBottom: 16,
    gap: 8,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginTop: 14,
    marginBottom: 2,
  },
  filterHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  tagsSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    height: '62%',
    flexDirection: 'column',
  },
  tagsSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  tagsSheetTitleBlock: {
    flex: 1,
  },
  tagsSheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.3,
  },
  tagsSheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tagsCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  tagsEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  tagsEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.note.soft,
    marginBottom: 4,
  },
  tagsPrimaryButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  tagsPrimaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  tagsList: {
    flex: 1,
    minHeight: 0,
  },
  tagsListContent: {
    paddingBottom: 8,
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.note.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  tagItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagItemCopy: {
    flex: 1,
    gap: 2,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  tagCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tagsSheetFooter: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  manageTagsButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  manageTagsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  filterItemRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.note.soft,
    backgroundColor: colors.note.background,
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  resetButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
