import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { SoundPicker } from '@/components/SoundPicker';
import { useToast } from '@/components/ToastContext';
import { clearSession, getStoredSession, type AuthSession } from '@/lib/auth';
import { backgroundSync } from '@/lib/backgroundSync';
import { networkMonitor, useForcedOffline, useIsOnline } from '@/lib/networkMonitor';
import {
  getPreferredAlarmSound,
  getPreferredReminderSound,
  setPreferredAlarmSound,
  setPreferredReminderSound,
} from '@/lib/notificationSoundPreference';
import { getSyncStats } from '@/lib/storage';
import { DEFAULT_NOTIFICATION_SOUND, type NotificationSoundId } from '@/constants/notificationSounds';
import { syncScheduledNotificationsFromBackend } from '@/services/notifications';
import { colors } from '@/theme/colors';
import { useTabContentPaddingBottom } from '@/theme/layout';
import { getTypeTheme, TYPE_LABELS, type ItemType } from '@/theme/typeColors';

const LIBRARY_TYPES: ItemType[] = ['note', 'blog', 'link', 'pdf', 'reminder'];
const alarmTheme = getTypeTheme('alarm');
const reminderTheme = getTypeTheme('reminder');

export default function SettingsScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [alarmSound, setAlarmSound] = useState<NotificationSoundId>(DEFAULT_NOTIFICATION_SOUND);
  const [reminderSound, setReminderSound] = useState<NotificationSoundId>(DEFAULT_NOTIFICATION_SOUND);
  const [syncStats, setSyncStats] = useState({
    totalEntities: 0,
    dirtyEntities: 0,
    pendingSyncItems: 0,
    failedSyncItems: 0,
  });
  const { showSuccess, showError, showInfo } = useToast();
  const isOnline = useIsOnline();
  const forcedOffline = useForcedOffline();
  const tabPaddingBottom = useTabContentPaddingBottom();

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const stored = await getStoredSession();
      if (active) setSession(stored);
    };

    const loadSyncStats = async () => {
      const stats = await getSyncStats();
      if (active) setSyncStats(stats);
    };

    const loadSounds = async () => {
      const [nextAlarm, nextReminder] = await Promise.all([
        getPreferredAlarmSound(),
        getPreferredReminderSound(),
      ]);
      if (active) {
        setAlarmSound(nextAlarm);
        setReminderSound(nextReminder);
      }
    };

    loadSession();
    loadSyncStats();
    loadSounds();

    const interval = setInterval(loadSyncStats, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const user = session?.user;
  const initials = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'A';
  const pendingCount = syncStats.pendingSyncItems + syncStats.failedSyncItems;

  const handleAlarmSound = async (sound: NotificationSoundId) => {
    setAlarmSound(sound);
    await setPreferredAlarmSound(sound);
    try {
      await syncScheduledNotificationsFromBackend();
    } catch (error) {
      console.error('[Settings] Failed to reschedule alarms', error);
    }
  };

  const handleReminderSound = async (sound: NotificationSoundId) => {
    setReminderSound(sound);
    await setPreferredReminderSound(sound);
    try {
      await syncScheduledNotificationsFromBackend();
    } catch (error) {
      console.error('[Settings] Failed to reschedule reminders', error);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/login' as any);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      showError('No internet connection');
      return;
    }

    setSyncing(true);
    try {
      await backgroundSync.triggerManualSync();
      const stats = await getSyncStats();
      setSyncStats(stats);
      showSuccess('Sync completed');
    } catch (error) {
      console.error('[Settings] Manual sync failed', error);
      showError('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: tabPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSubtitle}>Account, alarm sounds, and sync</Text>

        <View style={styles.profileHero}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{user?.fullName || 'Guest User'}</Text>
              <Text style={styles.profileRole}>{user?.title || 'User'}</Text>
              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? colors.success : colors.error },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isOnline ? colors.success : colors.error },
                  ]}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailBlock}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <AppIcon name="call-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{user?.mobile || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <AppIcon name="briefcase-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{user?.title || 'User'}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Sounds</Text>
        <View style={[styles.soundCard, { backgroundColor: alarmTheme.background }]}>
          <SoundPicker
            label="Alarm sound"
            value={alarmSound}
            onChange={(sound) => void handleAlarmSound(sound)}
            accentColor={alarmTheme.primary}
          />
        </View>
        <View style={[styles.soundCard, { backgroundColor: reminderTheme.background }]}>
          <SoundPicker
            label="Reminder sound"
            value={reminderSound}
            onChange={(sound) => void handleReminderSound(sound)}
            accentColor={reminderTheme.primary}
          />
        </View>

        <Text style={styles.sectionLabel}>Library types</Text>
        <View style={styles.typeRow}>
          {LIBRARY_TYPES.map((type) => {
            const theme = getTypeTheme(type);
            return (
              <View key={type} style={[styles.typeChip, { backgroundColor: theme.muted }]}>
                <View style={[styles.typeDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.typeChipText, { color: theme.dark }]}>
                  {TYPE_LABELS[type]}
                </Text>
              </View>
            );
          })}
        </View>

        {__DEV__ ? (
          <>
            <Text style={styles.sectionLabel}>Developer</Text>
            <Pressable
              style={styles.forceOfflineRow}
              onPress={() => {
                void networkMonitor.setForcedOffline(!forcedOffline).then(() => {
                  showInfo(
                    !forcedOffline
                      ? 'App will save locally without calling the server. Metro can stay connected.'
                      : 'Live server saves are on again.',
                  );
                });
              }}
            >
              <View style={styles.forceOfflineCopy}>
                <Text style={styles.forceOfflineTitle}>Simulate offline</Text>
                <Text style={styles.forceOfflineHint}>
                  Test local saves without airplane mode (keeps Metro connected)
                </Text>
              </View>
              <View style={[styles.forceOfflinePill, forcedOffline && styles.forceOfflinePillOn]}>
                <Text style={[styles.forceOfflinePillText, forcedOffline && styles.forceOfflinePillTextOn]}>
                  {forcedOffline ? 'On' : 'Off'}
                </Text>
              </View>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Sync</Text>
        <View style={styles.syncPanel}>
          <View style={styles.syncStat}>
            <Text style={styles.syncStatValue}>{syncStats.totalEntities}</Text>
            <Text style={styles.syncStatLabel}>Saved items</Text>
          </View>
          <View style={styles.syncStatDivider} />
          <View style={styles.syncStat}>
            <Text
              style={[
                styles.syncStatValue,
                pendingCount > 0 && { color: colors.warning },
              ]}
            >
              {pendingCount}
            </Text>
            <Text style={styles.syncStatLabel}>Pending sync</Text>
          </View>
        </View>

        <Pressable
          style={[styles.syncButton, (!isOnline || syncing) && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={!isOnline || syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <AppIcon name="sync-outline" size={18} color="#fff" />
              <Text style={styles.syncButtonText}>
                {isOnline ? 'Sync now' : 'Connect to sync'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <AppIcon name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: -6,
    marginBottom: 4,
  },
  profileHero: {
    backgroundColor: colors.note.background,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.note.soft,
    padding: 18,
    gap: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  profileRole: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailBlock: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
    marginTop: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 60,
  },
  sectionLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  forceOfflineRow: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  forceOfflineCopy: {
    flex: 1,
    gap: 4,
  },
  forceOfflineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  forceOfflineHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  forceOfflinePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryMuted,
  },
  forceOfflinePillOn: {
    backgroundColor: colors.error,
  },
  forceOfflinePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  forceOfflinePillTextOn: {
    color: '#fff',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  soundCard: {
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  syncPanel: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  syncStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  syncStatDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.borderLight,
  },
  syncStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  syncStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  syncButtonDisabled: {
    opacity: 0.55,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: colors.error,
    fontWeight: '800',
    fontSize: 16,
  },
});
