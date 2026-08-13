import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { getReminders, updateReminder } from '@/api/reminders';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundPicker } from '@/components/SoundPicker';
import { useToast } from '@/components/ToastContext';
import {
  DEFAULT_NOTIFICATION_SOUND,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import {
  ensureNotificationSetup,
  scheduleReminderNotifications,
} from '@/services/notifications';
import type { ReminderItem } from '@/types';

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
  const [sound, setSound] = useState<NotificationSoundId>(DEFAULT_NOTIFICATION_SOUND);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; date?: string; time?: string }>({});
  const { showSuccess, showError, showWarning } = useToast();

  useMemo(() => {
    async function loadReminder() {
      if (!id) return;
      try {
        const data = await getReminders();
        const reminder = data.reminders.find((r) => r.id === id);
        if (reminder) {
          setTitle(reminder.title);
          setDescription(reminder.description || '');
          const dueDate = new Date(reminder.dueAt);
          setDate(toLocalDateInput(dueDate));
          setTime(toLocalTimeInput(dueDate));
          setRepeat((reminder.repeat as any) || 'none');
          setSound(reminder.sound);
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

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/reminders');
  };

  async function submit() {
    if (!id) return;
    
    const newErrors: { title?: string; date?: string; time?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Reminder title is required';
    }

    const dueAt = combineLocalDateTime(date, time);
    if (!dueAt) {
      newErrors.date = 'Invalid date format (YYYY-MM-DD)';
      newErrors.time = 'Invalid time format (HH:MM)';
    }

    if (repeat === 'none' && dueAt && dueAt.getTime() <= Date.now()) {
      newErrors.time = 'One-time reminders must be scheduled in the future';
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

      const result = await updateReminder(id, {
        title: title.trim(),
        description: description.trim(),
        dueAt: dueAt!.toISOString(),
        priority: 'medium',
        repeat,
        sound,
      });

      await scheduleReminderNotifications(result.reminder);
      setLoading(false);
      showSuccess('Reminder updated successfully');
      router.back();
    } catch (error) {
      console.error('[Reminder Edit] Failed', error);
      setLoading(false);
      showError('Could not update reminder. Please try again.');
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <Text style={styles.title}>Edit Reminder</Text>
        <Text style={styles.hint}>
          Update your reminder settings.
        </Text>

        <Input
          label="Reminder Title"
          placeholder="Enter reminder title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Input
          label="Description"
          placeholder="Enter description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          error={errors.date}
          autoCapitalize="none"
        />
        <Input
          label="Time"
          placeholder="HH:MM"
          value={time}
          onChangeText={setTime}
          error={errors.time}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.sectionLabel}>Repeat</Text>
        <View style={styles.row}>
          {REPEAT_OPTIONS.map((option) => {
            const selected = option.id === repeat;
            return (
              <Pressable
                key={option.id}
                onPress={() => setRepeat(option.id)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <SoundPicker value={sound} onChange={setSound} />

        <PrimaryButton title={loading ? 'Saving...' : 'Update Reminder'} onPress={submit} disabled={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f6fb' },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  headerRow: { marginBottom: 4 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#dfe9ff',
  },
  title: { fontSize: 30, fontWeight: '800', color: '#1d2f5f', letterSpacing: -0.5 },
  hint: { fontSize: 13, color: '#64748b', lineHeight: 18, marginTop: -4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1d2f5f' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3ebf7',
  },
  chipSelected: { backgroundColor: '#22409a', borderColor: '#22409a' },
  chipText: { fontWeight: '700', color: '#64748b', fontSize: 13 },
  chipTextSelected: { color: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
});
