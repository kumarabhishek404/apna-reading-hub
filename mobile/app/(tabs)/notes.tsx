import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getBlogs } from '@/api/blogs';
import { getLinks } from '@/api/links';
import { getNotes } from '@/api/notes';
import { getPdfs } from '@/api/pdfs';
import { getReminders } from '@/api/reminders';
import { getTags, type TagItem } from '@/api/tags';
import { AppIcon } from '@/components/AppIcon';
import {
  NoteBoardCard,
  REMINDER_CARD_PALETTE,
  formatBoardDate,
  paletteForId,
} from '@/components/NoteBoardCard';
import { useDataSync } from '@/lib/dataSync';
import { noteContains, noteMatchesText, type NoteContainsKind } from '@/lib/noteContains';
import { noteCardSnippet, noteHeadline } from '@/lib/noteHeadline';
import {
  noteOfflineRepository,
  reminderOfflineRepository,
} from '@/lib/offlineRepositories/genericOfflineRepository';
import { mergeServerAndLocal } from '@/lib/offlineMerge';
import { parseSearchQuery } from '@/lib/searchQuery';
import { colors } from '@/theme/colors';
import { useFabBottomOffset, useTabContentPaddingBottom } from '@/theme/layout';
import { getTypeTheme } from '@/theme/typeColors';
import type { BlogItem, LinkItem, NoteItem, PdfItem, ReminderItem } from '@/types';

const noteTheme = getTypeTheme('note');

type FilterId = 'all' | NoteContainsKind | 'reminder';
type TimeFilter = 'all' | 'monthly' | 'yearly';

type BoardEntry =
  | { kind: 'note'; item: NoteItem }
  | { kind: 'reminder'; item: ReminderItem }
  | { kind: 'blog'; item: BlogItem }
  | { kind: 'link'; item: LinkItem }
  | { kind: 'pdf'; item: PdfItem };

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'link', label: 'Links' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'image', label: 'Photos' },
  { id: 'reminder', label: 'Reminders' },
];

const TYPE_OPTIONS: Array<{
  key: FilterId;
  label: string;
  icon: 'apps-outline' | 'link-outline' | 'document-outline' | 'image-outline' | 'notifications-outline';
  accent: string;
  muted: string;
  dark: string;
  soft: string;
}> = [
  { key: 'all', label: 'All', icon: 'apps-outline', accent: colors.primary, muted: colors.primaryMuted, dark: colors.primaryDark, soft: colors.note.soft },
  { key: 'link', label: 'Links', icon: 'link-outline', accent: colors.link.primary, muted: colors.link.muted, dark: colors.link.dark, soft: colors.link.soft },
  { key: 'pdf', label: 'PDFs', icon: 'document-outline', accent: colors.pdf.primary, muted: colors.pdf.muted, dark: colors.pdf.dark, soft: colors.pdf.soft },
  { key: 'image', label: 'Photos', icon: 'image-outline', accent: colors.blog.primary, muted: colors.blog.muted, dark: colors.blog.dark, soft: colors.blog.soft },
  { key: 'reminder', label: 'Reminders', icon: 'notifications-outline', accent: colors.reminder.primary, muted: colors.reminder.muted, dark: colors.reminder.dark, soft: colors.reminder.soft },
];

function reminderScheduleLabel(item: ReminderItem) {
  const due = new Date(item.dueAt);
  if (Number.isNaN(due.getTime())) return 'Reminder';
  const time = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (item.repeat === 'none') return time;
  return `${time} ${item.repeat.toUpperCase()}`;
}

function matchesTimeFilter(createdAt: string, time: TimeFilter) {
  if (time === 'all') return true;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date();
  if (time === 'monthly') cutoff.setMonth(cutoff.getMonth() - 1);
  else cutoff.setFullYear(cutoff.getFullYear() - 1);
  return date >= cutoff;
}

function entryMatches(
  entry: BoardEntry,
  filter: FilterId,
  tag: string | null,
  query: string,
  time: TimeFilter,
) {
  if (!matchesTimeFilter(entry.item.createdAt, time)) return false;
  const parsed = parseSearchQuery(query);
  const kind = filter === 'all' ? parsed.contains : filter === 'reminder' ? null : filter;
  const text = parsed.text || (kind || filter === 'reminder' ? '' : query.trim());

  if (filter === 'reminder') {
    if (entry.kind !== 'reminder') return false;
    if (!text) return true;
    const haystack = `${entry.item.title} ${entry.item.description || ''}`.toLowerCase();
    return haystack.includes(text.toLowerCase());
  }

  if (entry.kind === 'reminder') return false;

  if (kind === 'link') {
    const isLink =
      entry.kind === 'link' ||
      (entry.kind === 'blog' && Boolean(entry.item.url)) ||
      (entry.kind === 'note' && noteContains(entry.item, 'link'));
    if (!isLink) return false;
    if (!text) return true;
    if (entry.kind === 'note') return noteMatchesText(entry.item, text);
    const haystack = `${entry.item.title} ${'url' in entry.item ? entry.item.url || '' : ''} ${
      'content' in entry.item ? entry.item.content : ''
    }`.toLowerCase();
    return haystack.includes(text.toLowerCase());
  }

  if (kind === 'pdf') {
    const isPdf =
      entry.kind === 'pdf' || (entry.kind === 'note' && noteContains(entry.item, 'pdf'));
    if (!isPdf) return false;
    if (!text) return true;
    if (entry.kind === 'note') return noteMatchesText(entry.item, text);
    return `${entry.item.title} ${'description' in entry.item ? entry.item.description || '' : ''}`
      .toLowerCase()
      .includes(text.toLowerCase());
  }

  if (kind === 'image') {
    if (!(entry.kind === 'note' && noteContains(entry.item, 'image'))) return false;
    return !text || noteMatchesText(entry.item, text);
  }

  if (tag) {
    const names =
      'tags' in entry.item && Array.isArray(entry.item.tags)
        ? entry.item.tags.map((item) => item.name)
        : [];
    if (!names.includes(tag)) return false;
  }

  if (text) {
    if (entry.kind === 'note') return noteMatchesText(entry.item, text);
    const haystack = `${entry.item.title} ${'content' in entry.item ? entry.item.content : ''} ${
      'url' in entry.item ? entry.item.url || '' : ''
    } ${'description' in entry.item ? entry.item.description || '' : ''}`.toLowerCase();
    return haystack.includes(text.toLowerCase());
  }

  return true;
}

function cardCopy(entry: BoardEntry) {
  if (entry.kind === 'note') {
    const title = noteHeadline(entry.item);
    return {
      dateLabel: formatBoardDate(entry.item.createdAt),
      title,
      snippet: noteCardSnippet(entry.item, title),
      images: (entry.item.blocks ?? [])
        .filter((block) => block.type === 'image' && block.url)
        .map((block) => block.url as string),
      tags: entry.item.tags?.map((tag) => tag.name) ?? [],
      scheduleLabel: undefined as string | undefined,
    };
  }

  if (entry.kind === 'reminder') {
    return {
      dateLabel: formatBoardDate(entry.item.dueAt || entry.item.createdAt),
      title: entry.item.title,
      snippet: entry.item.description || undefined,
      images: [] as string[],
      tags: [] as string[],
      scheduleLabel: reminderScheduleLabel(entry.item),
    };
  }

  if (entry.kind === 'link') {
    return {
      dateLabel: formatBoardDate(entry.item.createdAt),
      title: entry.item.title,
      snippet: entry.item.url,
      images: [] as string[],
      tags: entry.item.tags?.map((tag) => tag.name) ?? [],
      scheduleLabel: undefined as string | undefined,
    };
  }

  if (entry.kind === 'pdf') {
    return {
      dateLabel: formatBoardDate(entry.item.createdAt),
      title: entry.item.title,
      snippet: entry.item.description || 'PDF',
      images: [] as string[],
      tags: entry.item.tags?.map((tag) => tag.name) ?? [],
      scheduleLabel: undefined as string | undefined,
    };
  }

  return {
    dateLabel: formatBoardDate(entry.item.createdAt),
    title: entry.item.title,
    snippet: entry.item.url || entry.item.content || undefined,
    images: [] as string[],
    tags: entry.item.tags?.map((tag) => tag.name) ?? [],
    scheduleLabel: undefined as string | undefined,
  };
}

export default function NotesScreen() {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setContains] = useState<FilterId>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [draftFilter, setDraftFilter] = useState<FilterId>('all');
  const [draftTimeFilter, setDraftTimeFilter] = useState<TimeFilter>('all');
  const [draftTag, setDraftTag] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tabPaddingBottom = useTabContentPaddingBottom();
  const fabBottom = useFabBottomOffset();

  const load = useCallback(async () => {
    try {
      const [notesRes, remindersRes, blogsRes, linksRes, pdfsRes, tagsRes] = await Promise.all([
        getNotes(),
        getReminders(),
        getBlogs().catch(() => ({ blogs: [] as BlogItem[] })),
        getLinks().catch(() => ({ links: [] as LinkItem[] })),
        getPdfs().catch(() => ({ pdfs: [] as PdfItem[] })),
        getTags().catch(() => ({ tags: [] as TagItem[] })),
      ]);

      await Promise.all([
        noteOfflineRepository.hydrateFromServer('note', notesRes.notes),
        reminderOfflineRepository.hydrateFromServer('reminder', remindersRes.reminders),
      ]);

      const [offlineNotes, offlineReminders] = await Promise.all([
        noteOfflineRepository.getAllEntities('note'),
        reminderOfflineRepository.getAllEntities('reminder'),
      ]);

      const notes = mergeServerAndLocal(notesRes.notes, offlineNotes as NoteItem[], 'note');
      const reminders = mergeServerAndLocal(
        remindersRes.reminders,
        offlineReminders as ReminderItem[],
        'reminder',
      );

      const combined: BoardEntry[] = [
        ...notes.map((item) => ({ kind: 'note' as const, item })),
        ...reminders.map((item) => ({ kind: 'reminder' as const, item })),
        ...blogsRes.blogs.map((item) => ({ kind: 'blog' as const, item })),
        ...linksRes.links.map((item) => ({ kind: 'link' as const, item })),
        ...pdfsRes.pdfs.map((item) => ({ kind: 'pdf' as const, item })),
      ].sort((a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime());

      setEntries(combined);
      setTags(tagsRes.tags || []);
      setError(null);
    } catch (err) {
      console.error('[Notes] Failed to load from server, trying offline storage', err);
      try {
        const [offlineNotes, offlineReminders] = await Promise.all([
          noteOfflineRepository.getAllEntities('note'),
          reminderOfflineRepository.getAllEntities('reminder'),
        ]);
        setEntries([
          ...offlineNotes.map((item) => ({ kind: 'note' as const, item: item as NoteItem })),
          ...offlineReminders.map((item) => ({ kind: 'reminder' as const, item: item as ReminderItem })),
        ]);
        setError(null);
      } catch (offlineErr) {
        console.error('[Notes] Failed to load from offline storage', offlineErr);
        setError('Could not load notes');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useDataSync(load, { immediate: false, interval: 60000 });

  const visible = useMemo(
    () => entries.filter((entry) => entryMatches(entry, filter, selectedTag, query, timeFilter)),
    [entries, filter, selectedTag, query, timeFilter],
  );

  const filtersActive = filter !== 'all' || selectedTag !== null || timeFilter !== 'all';

  function openFilterModal() {
    setDraftFilter(filter);
    setDraftTimeFilter(timeFilter);
    setDraftTag(selectedTag);
    setFilterModalVisible(true);
  }

  function closeFilterModal() {
    setFilterModalVisible(false);
  }

  function resetDraftFilters() {
    setDraftFilter('all');
    setDraftTimeFilter('all');
    setDraftTag(null);
  }

  function applyDraftFilters() {
    setContains(draftFilter);
    setTimeFilter(draftTimeFilter);
    setSelectedTag(draftFilter === 'reminder' ? null : draftTag);
    setFilterModalVisible(false);
  }

  const columns = useMemo(() => {
    const left: BoardEntry[] = [];
    const right: BoardEntry[] = [];
    visible.forEach((entry, index) => {
      (index % 2 === 0 ? left : right).push(entry);
    });
    return { left, right };
  }, [visible]);

  function openCreate() {
    router.push('/capture' as any);
  }

  async function openEntry(entry: BoardEntry) {
    if (entry.kind === 'note') {
      router.push(`/notes/edit?id=${entry.item.id}` as any);
      return;
    }
    if (entry.kind === 'reminder') {
      router.push(`/reminders/edit?id=${entry.item.id}`);
      return;
    }
    if (entry.kind === 'link') {
      router.push(`/links/edit?id=${entry.item.id}`);
      return;
    }
    if (entry.kind === 'pdf') {
      router.push(`/pdfs/view?id=${entry.item.id}`);
      return;
    }
    router.push(`/blogs/edit?id=${entry.item.id}`);
  }

  function renderCard(entry: BoardEntry) {
    const copy = cardCopy(entry);
    return (
      <NoteBoardCard
        key={`${entry.kind}-${entry.item.id}`}
        dateLabel={copy.dateLabel}
        title={copy.title}
        snippet={copy.snippet}
        images={copy.images}
        tags={copy.tags}
        scheduleLabel={copy.scheduleLabel}
        palette={entry.kind === 'reminder' ? REMINDER_CARD_PALETTE : paletteForId(entry.item.id)}
        onPress={() => void openEntry(entry)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarCopy}>
          <Text style={styles.toolbarTitle}>Apna Notes</Text>
          <Text style={styles.toolbarHint}>
            {visible.length === 1 ? '1 item' : `${visible.length} items`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.filterButton}
            onPress={openFilterModal}
            accessibilityRole="button"
            accessibilityLabel="Filter notes"
          >
            <AppIcon
              name="funnel-outline"
              size={18}
              color={filtersActive ? colors.primaryDark : colors.primary}
            />
          </Pressable>
          <Pressable
            style={styles.tagButton}
            onPress={() => router.push('/tags')}
            accessibilityRole="button"
            accessibilityLabel="Open tags"
          >
            <AppIcon name="pricetag-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <AppIcon name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search, or type links / pdfs"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((item) => {
            const selected = filter === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => {
                  setContains(item.id);
                  if (item.id === 'reminder') setSelectedTag(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Show ${item.label}`}
              >
                <View style={styles.filterChipLabel}>
                  <Text
                    style={[styles.filterChipText, selected && styles.filterChipTextSelected]}
                    allowFontScaling={false}
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {tags.slice(0, 8).map((tag) => {
            const selected = selectedTag === tag.name;
            return (
              <Pressable
                key={tag.id}
                style={[styles.filterChip, selected && styles.tagChipSelected]}
                onPress={() => {
                  setSelectedTag(selected ? null : tag.name);
                  if (!selected) setContains('all');
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tag.name}`}
              >
                <View style={styles.filterChipLabel}>
                  <Text
                    style={[styles.filterChipText, selected && styles.tagChipTextSelected]}
                    allowFontScaling={false}
                  >
                    {tag.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={noteTheme.primary} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: tabPaddingBottom + 56 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={noteTheme.primary}
              colors={[noteTheme.primary]}
            />
          }
        >
          {visible.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <AppIcon name="document-text-outline" size={36} color={noteTheme.primary} />
              </View>
              <Text style={styles.emptyText}>Nothing here yet</Text>
              <Text style={styles.emptySubtext}>
                {query.trim() || filter !== 'all' || selectedTag || timeFilter !== 'all'
                  ? 'Nothing matches this search or filter.'
                  : 'Create a note to fill your board'}
              </Text>
            </View>
          ) : (
            <View style={styles.masonry}>
              <View style={styles.column}>{columns.left.map(renderCard)}</View>
              <View style={styles.column}>{columns.right.map(renderCard)}</View>
            </View>
          )}
        </ScrollView>
      )}

      <Pressable
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Create new note"
      >
          <AppIcon name="add" size={26} color="#fff" />
      </Pressable>

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={closeFilterModal} />
          <View style={styles.filterSheet}>
            <View style={styles.filterSheetHeader}>
              <View style={styles.filterSheetTitleBlock}>
                <Text style={styles.filterSheetTitle}>Filter notes</Text>
                <Text style={styles.filterSheetSubtitle}>
                  Choose types, time, and tags — then tap Done
                </Text>
              </View>
              <Pressable
                style={styles.filterCloseButton}
                onPress={closeFilterModal}
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
              <Text style={styles.filterHint}>Select one type</Text>
              {TYPE_OPTIONS.map((option) => {
                const selected = draftFilter === option.key;
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
                    onPress={() => {
                      setDraftFilter(option.key);
                      if (option.key === 'reminder') setDraftTag(null);
                    }}
                  >
                    <View style={[styles.filterItemIcon, { backgroundColor: option.accent }]}>
                      <AppIcon name={option.icon} size={16} color="#fff" />
                    </View>
                    <Text style={[styles.filterItemText, { color: selected ? option.dark : colors.text }]}>
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
                    onPress={() => setDraftTimeFilter(option.key)}
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
                onPress={() => setDraftTag(null)}
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
                const selected = draftTag === tag.name;
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
                    onPress={() => {
                      setDraftTag(tag.name);
                      if (draftFilter === 'reminder') setDraftFilter('all');
                    }}
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
              <Pressable style={styles.applyButton} onPress={applyDraftFilters}>
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  toolbarCopy: {
    flex: 1,
    gap: 2,
  },
  toolbarTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  toolbarHint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  filterBar: {
    marginBottom: 6,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  filterChipLabel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipSelected: {
    backgroundColor: noteTheme.primary,
    borderColor: noteTheme.primary,
  },
  filterChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: noteTheme.dark,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  tagChipSelected: {
    backgroundColor: noteTheme.muted,
    borderColor: noteTheme.primary,
  },
  tagChipTextSelected: {
    color: noteTheme.dark,
  },
  masonry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  error: {
    marginTop: 16,
    color: colors.error,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: noteTheme.muted,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: noteTheme.dark,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
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
