import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteReminder, getReminders, updateReminder } from '@/api/reminders';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TimePicker } from '@/components/TimePicker';
import { DatePicker } from '@/components/DatePicker';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import { reminderOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { isLocalEntityId } from '@/lib/offlineMerge';
import { networkMonitor } from '@/lib/networkMonitor';
import { AppIcon } from '@/components/AppIcon';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TimePicker } from '@/components/TimePicker';
import { DatePicker } from '@/components/DatePicker';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import {
  ensureNotificationSetup,
  scheduleReminderNotifications,
} from '@/services/notifications';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';

const TYPE = 'reminder' as const;
const theme = getTypeTheme(TYPE);

const REPEAT_OPTIONS: Array<{ id: 'none' | 'daily' | 'weekly' | 'monthly'; label: string }> = [
  { id: 'none', label: 'Once' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function toLocalDateInput(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toLocalTimeInput(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function combineLocalDateTime(date: string, time: string) {
  const matchDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const matchTime = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!matchDate || !matchTime) return null;

  const due = new Date(
    Number(matchDate[1]),
    Number(matchDate[2]) - 1,
    Number(matchDate[3]),
    Number(matchTime[1]),
    Number(matchTime[2]),
    0,
    0,
  );
  if (Number.isNaN(due.getTime())) return null;
  return due;
}

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const initial = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d;
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toLocalDateInput(initial));
  const [time, setTime] = useState(toLocalTimeInput(initial));
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const { showSuccess, showError, showWarning } = useToast();

  useMemo(() => {
    async function loadReminder() {
      if (!id) return;
      try {
        let reminder = await reminderOfflineRepository.getEntity('reminder', id);
        if (!reminder && !isLocalEntityId(id, 'reminder')) {
          const data = await getReminders();
          reminder = data.reminders.find((r) => r.id === id) || null;
          if (reminder) await reminderOfflineRepository.syncFromServer('reminder', reminder);
        }
        if (reminder) {
          setTitle(reminder.title);
          setDescription(reminder.description || '');
          const dueDate = new Date(reminder.dueAt);
          setDate(toLocalDateInput(dueDate));
          setTime(toLocalTimeInput(dueDate));
          setRepeat((reminder.repeat as any) || 'none');
        } else {
          showError('Could not load reminder');
          router.back();
        }
      } catch (error) {
        showError('Could not load reminder');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }
    loadReminder();
  }, [id]);

  async function submit() {
    if (!id) return;
    
    const newErrors: { title?: string; date?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Reminder title is required';
    }

    const dueAt = combineLocalDateTime(date, time);
    if (!dueAt) {
      newErrors.date = 'Invalid date format (YYYY-MM-DD)';
    }

    if (repeat === 'none' && dueAt && dueAt.getTime() <= Date.now()) {
      newErrors.date = 'One-time reminders must be scheduled in the future';
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
        showWarning('Enable notifications in system settings for reliable reminders');
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueAt: dueAt!.toISOString(),
        priority: 'medium' as const,
        repeat,
      };

      const saveOffline = async () => {
        const reminder = await reminderOfflineRepository.updateEntity('reminder', id, payload);
        await scheduleReminderNotifications(reminder as any);
        setLoading(false);
        showSuccess('Reminder saved on this device');
        router.back();
      };

      if (isLocalEntityId(id, 'reminder') || !networkMonitor.isOnline()) {
        await saveOffline();
        return;
      }

      try {
        const result = await updateReminder(id, payload);
        await scheduleReminderNotifications(result.reminder);
        setLoading(false);
        showSuccess('Reminder updated successfully');
        router.back();
      } catch (error) {
        console.error('[Reminder Edit] Failed, saving offline', error);
        try {
          await saveOffline();
        } catch {
          setLoading(false);
          showError('Could not update reminder. Please try again.');
        }
      }
    } catch (error) {
      console.error('[Reminder Edit] Failed', error);
      setLoading(false);
      showError('Could not update reminder. Please try again.');
    }
  }

  function confirmDelete() {
    if (!id || deleting) return;
    Alert.alert('Delete this reminder?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeReminder() },
    ]);
  }

  async function removeReminder() {
    if (!id) return;
    setDeleting(true);
    try {
      if (isLocalEntityId(id, 'reminder') || !networkMonitor.isOnline()) {
        await reminderOfflineRepository.deleteEntity('reminder', id);
      } else {
        try {
          await deleteReminder(id);
        } catch {
          await reminderOfflineRepository.deleteEntity('reminder', id);
        }
      }
      showSuccess('Reminder deleted');
      router.back();
    } catch (error) {
      console.error('[Reminder Edit] Delete failed', error);
      setDeleting(false);
      showError('Could not delete this reminder');
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
    <TypeThemedScreen type={TYPE} title="Edit Reminder" scroll>
      <Text style={styles.hint}>
        Update your reminder settings.
      </Text>

      <Input
        label="Reminder Title"
        placeholder="Enter reminder title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        accentColor={theme.primary}
      />
      <Input
        label="Description"
        placeholder="Enter description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        accentColor={theme.primary}
      />
      <DatePicker value={date} onChange={setDate} label="Date" accentColor={theme.primary} />
      <TimePicker value={time} onChange={setTime} label="Time" accentColor={theme.primary} />

      <Text style={[styles.sectionLabel, { color: theme.dark }]}>Repeat</Text>
      <View style={styles.row}>
        {REPEAT_OPTIONS.map((option) => {
          const selected = option.id === repeat;
          return (
            <Pressable
              key={option.id}
              onPress={() => setRepeat(option.id)}
              style={[
                styles.chip,
                selected && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        title={loading ? 'Saving...' : 'Update Reminder'}
        onPress={submit}
        disabled={loading || deleting}
        color={theme.primary}
      />
      <Pressable
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={deleting || loading}
        accessibilityRole="button"
        accessibilityLabel="Delete reminder"
      >
        <AppIcon name="trash-outline" size={16} color="#BE123C" />
        <Text style={styles.deleteButtonText}>{deleting ? 'Deleting…' : 'Delete reminder'}</Text>
      </Pressable>
    </TypeThemedScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: -4 },
  sectionLabel: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3ebf7',
  },
  chipText: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  chipTextSelected: { color: '#fff' },
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
