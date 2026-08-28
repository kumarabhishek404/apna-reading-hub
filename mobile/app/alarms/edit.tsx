import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteAlarm, getAlarms, updateAlarm } from '@/api/alarms';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TimePicker } from '@/components/TimePicker';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { alarmOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { isLocalEntityId } from '@/lib/offlineMerge';
import { networkMonitor } from '@/lib/networkMonitor';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TimePicker } from '@/components/TimePicker';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import {
  ensureNotificationSetup,
  scheduleAlarmNotifications,
  syncScheduledNotificationsFromBackend,
} from '@/services/notifications';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'alarm' as const;
const theme = getTypeTheme(TYPE);

const DAY_OPTIONS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export default function EditAlarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { showSuccess, showError, showWarning } = useToast();

  const allDaysSelected = useMemo(() => repeatDays.length === 7, [repeatDays]);

  useMemo(() => {
    async function loadAlarm() {
      if (!id) return;
      try {
        let alarm = await alarmOfflineRepository.getEntity('alarm', id);
        if (!alarm && !isLocalEntityId(id, 'alarm')) {
          const data = await getAlarms();
          alarm = data.alarms.find((a) => a.id === id) || null;
          if (alarm) await alarmOfflineRepository.syncFromServer('alarm', alarm);
        }
        if (alarm) {
          setTitle(alarm.title);
          setTime(alarm.time);
          setRepeatDays(alarm.repeatDays);
          setIsEnabled(alarm.isEnabled);
        } else {
          showError('Could not load alarm');
          router.back();
        }
      } catch (error) {
        showError('Could not load alarm');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadAlarm();
  }, [id]);

  function toggleDay(day: number) {
    setRepeatDays((current) => {
      if (current.includes(day)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== day).sort((a, b) => a - b);
      }
      return [...current, day].sort((a, b) => a - b);
    });
  }

  async function submit() {
    if (!id) return;
    
    const newErrors: { title?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Alarm title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const permissionGranted = await ensureNotificationSetup();
      if (!permissionGranted) {
        showWarning('Enable notifications in system settings for reliable alarms');
      }

      const payload = {
        title: title.trim(),
        time: time.trim(),
        repeatDays,
        isEnabled,
      };

      const saveOffline = async () => {
        const alarm = await alarmOfflineRepository.updateEntity('alarm', id, payload);
        await scheduleAlarmNotifications(alarm as any);
        setLoading(false);
        showSuccess('Alarm saved on this device');
        router.back();
      };

      if (isLocalEntityId(id, 'alarm') || !networkMonitor.isOnline()) {
        await saveOffline();
        return;
      }

      try {
        const result = await updateAlarm(id, payload);
        await scheduleAlarmNotifications(result.alarm);
        setLoading(false);
        showSuccess('Alarm updated successfully');
        router.back();
      } catch (error) {
        console.error('[Alarm Edit] Failed, saving offline', error);
        try {
          await saveOffline();
        } catch {
          setLoading(false);
          showError('Could not update alarm. Please try again.');
        }
      }
    } catch (error) {
      console.error('[Alarm Edit] Failed', error);
      setLoading(false);
      showError('Could not update alarm. Please try again.');
    }
  }

  function confirmDelete() {
    if (!id || deleting) return;
    Alert.alert('Delete this alarm?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeAlarm() },
    ]);
  }

  async function removeAlarm() {
    if (!id) return;
    setDeleting(true);
    try {
      if (isLocalEntityId(id, 'alarm') || !networkMonitor.isOnline()) {
        await alarmOfflineRepository.deleteEntity('alarm', id);
      } else {
        try {
          await deleteAlarm(id);
        } catch {
          await alarmOfflineRepository.deleteEntity('alarm', id);
        }
      }
      await syncScheduledNotificationsFromBackend();
      showSuccess('Alarm deleted');
      router.back();
    } catch (error) {
      console.error('[Alarm Edit] Delete failed', error);
      setDeleting(false);
      showError('Could not delete this alarm');
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TypeThemedScreen type={TYPE} title="Edit Alarm" scroll fallbackHref="/(tabs)/alarms">
      <Text style={styles.hint}>
        Update your alarm settings. Keep notifications allowed for reliable ringing.
      </Text>

      <Input
        label="Alarm Label"
        placeholder="Enter alarm title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        accentColor={theme.primary}
      />
      <TimePicker value={time} onChange={setTime} label="Time" accentColor={theme.primary} />

      <Text style={[styles.sectionLabel, { color: theme.dark }]}>Status</Text>
      <View style={styles.statusRow}>
        <Pressable
          onPress={() => setIsEnabled(true)}
          style={[
            styles.statusButton,
            isEnabled && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.statusButtonText, isEnabled && styles.statusButtonTextSelected]}>ON</Text>
        </Pressable>
        <Pressable
          onPress={() => setIsEnabled(false)}
          style={[
            styles.statusButton,
            !isEnabled && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.statusButtonText, !isEnabled && styles.statusButtonTextSelected]}>OFF</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.dark }]}>Repeat</Text>
      <View style={styles.daysRow}>
        {DAY_OPTIONS.map((day) => {
          const selected = repeatDays.includes(day.value);
          return (
            <Pressable
              key={day.value}
              onPress={() => toggleDay(day.value)}
              style={[
                styles.dayChip,
                selected && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
            >
              <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{day.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.meta}>{allDaysSelected ? 'Every day' : `${repeatDays.length} day(s) selected`}</Text>

      <PrimaryButton
        title={loading ? 'Saving...' : 'Update Alarm'}
        onPress={submit}
        disabled={loading || deleting}
        color={theme.primary}
      />
      <Pressable
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={deleting || loading}
        accessibilityRole="button"
        accessibilityLabel="Delete alarm"
      >
        <AppIcon name="trash-outline" size={16} color="#BE123C" />
        <Text style={styles.deleteButtonText}>{deleting ? 'Deleting…' : 'Delete alarm'}</Text>
      </Pressable>
    </TypeThemedScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: -4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginTop: 16 },
  statusRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3ebf7',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonText: { fontWeight: '700', color: colors.textMuted },
  statusButtonTextSelected: { color: '#fff' },
  daysRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3ebf7',
  },
  dayChipText: { fontWeight: '700', color: colors.textMuted },
  dayChipTextSelected: { color: '#fff' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: -6 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(190,18,60,0.08)',
  },
  deleteButtonText: {
    color: '#BE123C',
    fontSize: 15,
    fontWeight: '700',
  },
});
