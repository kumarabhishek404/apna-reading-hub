import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useToast } from '@/components/ToastContext';
import { getAlarms } from '@/api/alarms';
import { getNotes } from '@/api/notes';
import { backgroundSync } from '@/lib/backgroundSync';
import { useIsOnline } from '@/lib/networkMonitor';
import { getSyncStats } from '@/lib/storage';
import { colors } from '@/theme/colors';
import { useTabContentPaddingBottom } from '@/theme/layout';
import { getTypeTheme } from '@/theme/typeColors';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const CREATE_OPTIONS: Array<{
  title: string;
  subtitle: string;
  icon: IoniconName;
  href: string;
  type: 'note' | 'blog' | 'link' | 'pdf' | 'alarm' | 'reminder';
}> = [
  {
    title: 'Note',
    subtitle: 'Write quickly',
    icon: 'document-text-outline',
    href: '/notes/create',
    type: 'note',
  },
  {
    title: 'Blog',
    subtitle: 'Save an article',
    icon: 'newspaper-outline',
    href: '/blogs/create',
    type: 'blog',
  },
  {
    title: 'Link',
    subtitle: 'Bookmark a URL',
    icon: 'link-outline',
    href: '/links/create',
    type: 'link',
  },
  {
    title: 'PDF',
    subtitle: 'Upload a file',
    icon: 'document-outline',
    href: '/pdfs/create',
    type: 'pdf',
  },
  {
    title: 'Alarm',
    subtitle: 'Daily schedule',
    icon: 'alarm-outline',
    href: '/alarms/create',
    type: 'alarm',
  },
  {
    title: 'Reminder',
    subtitle: 'One-time nudge',
    icon: 'notifications-outline',
    href: '/reminders/create',
    type: 'reminder',
  },
];

const JUMP_OPTIONS: Array<{
  title: string;
  icon: IoniconName;
  href: string;
  color: string;
  muted: string;
}> = [
  {
    title: 'Library',
    icon: 'book-outline',
    href: '/(tabs)/content',
    color: colors.blog.primary,
    muted: colors.blog.muted,
  },
  {
    title: 'Notes',
    icon: 'document-text-outline',
    href: '/(tabs)/notes',
    color: colors.note.primary,
    muted: colors.note.muted,
  },
  {
    title: 'Alarms',
    icon: 'alarm-outline',
    href: '/(tabs)/alarms',
    color: colors.alarm.primary,
    muted: colors.alarm.muted,
  },
  {
    title: 'Tags',
    icon: 'pricetag-outline',
    href: '/tags',
    color: colors.primary,
    muted: colors.primaryMuted,
  },
  {
    title: 'Profile',
    icon: 'person-outline',
    href: '/(tabs)/settings',
    color: colors.primaryDark,
    muted: colors.primaryMuted,
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const gap = 12;
  const horizontalPad = 20;
  const stackCreateTiles = width < 340;
  const tileWidth = stackCreateTiles
    ? width - horizontalPad * 2
    : (width - horizontalPad * 2 - gap) / 2;
  const tabPaddingBottom = useTabContentPaddingBottom();

  const isOnline = useIsOnline();
  const { showSuccess, showError } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [noteCount, setNoteCount] = useState(0);
  const [alarmCount, setAlarmCount] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);

  const loadOverview = useCallback(async () => {
    try {
      const [notesRes, alarmsRes, stats] = await Promise.all([
        getNotes().catch(() => ({ notes: [] })),
        getAlarms().catch(() => ({ alarms: [] })),
        getSyncStats().catch(() => ({
          totalEntities: 0,
          dirtyEntities: 0,
          pendingSyncItems: 0,
          failedSyncItems: 0,
        })),
      ]);
      setNoteCount(notesRes.notes?.length ?? 0);
      setAlarmCount(alarmsRes.alarms?.length ?? 0);
      setPendingSync((stats.pendingSyncItems || 0) + (stats.failedSyncItems || 0));
    } catch (error) {
      console.error('[Home] Failed to load overview', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
    }, [loadOverview]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  };

  const handleSync = async () => {
    if (!isOnline) {
      showError('No internet connection');
      return;
    }
    setSyncing(true);
    try {
      await backgroundSync.triggerManualSync();
      await loadOverview();
      showSuccess('Sync completed');
    } catch {
      showError('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.container, { paddingBottom: tabPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.brandMark}>apna notes</Text>
          <Text style={styles.screenTitle}>Create</Text>
          <Text style={styles.screenSubtitle}>
            Start something new, or jump back into your library.
          </Text>
        </View>

        <View style={styles.overviewRow}>
          <Pressable
            style={[styles.overviewChip, { backgroundColor: colors.note.muted }]}
            onPress={() => router.push('/(tabs)/notes')}
          >
            <Text style={[styles.overviewValue, { color: colors.note.primary }]}>{noteCount}</Text>
            <Text style={[styles.overviewLabel, { color: colors.note.dark }]}>Notes</Text>
          </Pressable>
          <Pressable
            style={[styles.overviewChip, { backgroundColor: colors.alarm.muted }]}
            onPress={() => router.push('/(tabs)/alarms')}
          >
            <Text style={[styles.overviewValue, { color: colors.alarm.primary }]}>{alarmCount}</Text>
            <Text style={[styles.overviewLabel, { color: colors.alarm.dark }]}>Alarms</Text>
          </Pressable>
          <Pressable
            style={[styles.overviewChip, { backgroundColor: colors.blog.muted }]}
            onPress={() => router.push('/(tabs)/content')}
          >
            <AppIcon name="book-outline" size={18} color={colors.blog.primary} />
            <Text style={[styles.overviewLabel, { color: colors.blog.dark }]}>Library</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>New item</Text>
        <View style={[styles.createGrid, { gap }]}>
          {CREATE_OPTIONS.map((option) => {
            const theme = getTypeTheme(option.type);
            return (
              <Pressable
                key={option.href}
                style={[
                  styles.createCard,
                  {
                    width: tileWidth,
                    backgroundColor: theme.background,
                    borderColor: theme.soft,
                  },
                ]}
                onPress={() => router.push(option.href as any)}
                accessibilityRole="button"
                accessibilityLabel={`Create ${option.title}`}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
                  <AppIcon name={option.icon} size={22} color="#fff" />
                </View>
                <Text style={[styles.createTitle, { color: theme.dark }]} numberOfLines={1}>
                  {option.title}
                </Text>
                <Text style={styles.createSubtitle} numberOfLines={1}>
                  {option.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Jump to</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.jumpRow}
        >
          {JUMP_OPTIONS.map((option) => (
            <Pressable
              key={option.href}
              style={[styles.jumpChip, { backgroundColor: option.muted }]}
              onPress={() => router.push(option.href as any)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${option.title}`}
            >
              <View style={[styles.jumpIcon, { backgroundColor: option.color }]}>
                <AppIcon name={option.icon} size={16} color="#fff" />
              </View>
              <Text style={[styles.jumpTitle, { color: option.color }]}>{option.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Sync</Text>
        <Pressable
          style={styles.syncCard}
          onPress={handleSync}
          disabled={syncing}
          accessibilityRole="button"
          accessibilityLabel="Sync now"
        >
          <View
            style={[
              styles.syncIconWrap,
              {
                backgroundColor: isOnline ? colors.primaryMuted : 'rgba(239, 68, 68, 0.12)',
              },
            ]}
          >
            <AppIcon
              name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
              size={22}
              color={isOnline ? colors.primary : colors.error}
            />
          </View>
          <View style={styles.syncCopy}>
            <Text style={styles.syncTitle}>
              {isOnline ? 'Ready to sync' : 'You are offline'}
            </Text>
            <Text style={styles.syncText}>
              {pendingSync > 0
                ? `${pendingSync} item${pendingSync === 1 ? '' : 's'} waiting to sync`
                : 'Everything is saved. Pull down or tap to sync.'}
            </Text>
          </View>
          <AppIcon
            name={syncing ? 'sync' : 'chevron-forward'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  hero: {
    gap: 4,
    marginBottom: 2,
  },
  brandMark: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
    textTransform: 'lowercase',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
    minHeight: 72,
    justifyContent: 'center',
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  createGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  createCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 132,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  createSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },
  jumpRow: {
    gap: 10,
    paddingRight: 8,
  },
  jumpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  jumpIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  syncIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCopy: {
    flex: 1,
    gap: 2,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  syncText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
