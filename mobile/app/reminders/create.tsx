import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createReminder } from '@/api/reminders';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundPicker } from '@/components/SoundPicker';
import { TimePicker } from '@/components/TimePicker';
import { DatePicker } from '@/components/DatePicker';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import {
  DEFAULT_NOTIFICATION_SOUND,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
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

export default function CreateReminderScreen() {
  const { linkedId, linkedType } = useLocalSearchParams<{ linkedId?: string; linkedType?: string }>();
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
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const { showSuccess, showError, showWarning } = useToast();

  useMemo(() => {
    if (linkedId && linkedType) {
      const typeLabels = {
        note: 'Note',
        blog: 'Blog',
        pdf: 'PDF',
        link: 'Link',
      };
      const label = typeLabels[linkedType as keyof typeof typeLabels] || 'Item';
      setTitle(`Reminder for ${label}`);
      setDescription(`Don't forget to check this ${label.toLowerCase()}`);
    }
  }, [linkedId, linkedType]);

  async function submit() {
    const newErrors: { title?: string; date?: string; time?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Reminder title is required';
    }

    const dueAt = combineLocalDateTime(date, time);
    if (!dueAt) {
      newErrors.date = 'Invalid date format (YYYY-MM-DD)';
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

      const result = await createReminder({
        title: title.trim(),
        description: description.trim(),
        dueAt: dueAt!.toISOString(),
        priority: 'medium',
        repeat,
        sound,
      });

      await scheduleReminderNotifications(result.reminder);
      setLoading(false);
      showSuccess('Reminder created successfully');
      router.back();
    } catch (error) {
      console.error('[Reminder Create] Failed', error);
      setLoading(false);
      showError('Could not create reminder. Please try again.');
    }
  }

  return (
    <TypeThemedScreen type={TYPE} title="New Reminder" scroll>
      <Text style={styles.hint}>
        Fires on this device at the due time with your selected sound.
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

      <SoundPicker value={sound} onChange={setSound} accentColor={theme.primary} />

      <PrimaryButton
        title={loading ? 'Saving...' : 'Create Reminder'}
        onPress={submit}
        disabled={loading}
        color={theme.primary}
      />
    </TypeThemedScreen>
  );
}

const styles = StyleSheet.create({
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
});
