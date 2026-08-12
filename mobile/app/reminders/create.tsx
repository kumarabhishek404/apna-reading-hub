import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { router } from 'expo-router';
import { createReminder } from '@/api/reminders';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundPicker } from '@/components/SoundPicker';
import {
  DEFAULT_NOTIFICATION_SOUND,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import {
  ensureNotificationSetup,
  scheduleReminderNotifications,
} from '@/services/notifications';

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

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/reminders');
  };

  async function submit() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give this reminder a short title.');
      return;
    }

    const dueAt = combineLocalDateTime(date, time);
    if (!dueAt) {
      Alert.alert('Invalid date/time', 'Use date YYYY-MM-DD and time HH:MM.');
      return;
    }

    if (repeat === 'none' && dueAt.getTime() <= Date.now()) {
      Alert.alert('Pick a future time', 'One-time reminders must be scheduled in the future.');
      return;
    }

    setLoading(true);
    try {
      const permissionGranted = await ensureNotificationSetup();
      if (!permissionGranted) {
        Alert.alert(
          'Notifications disabled',
          'Enable notifications in system settings so this reminder can alert on time.',
        );
      }

      const result = await createReminder({
        title: title.trim(),
        description: description.trim(),
        dueAt: dueAt.toISOString(),
        priority: 'medium',
        repeat,
        sound,
      });

      await scheduleReminderNotifications(result.reminder);
      setLoading(false);
      router.back();
    } catch (error) {
      console.error('[Reminder Create] Failed', error);
      setLoading(false);
      Alert.alert('Could not create reminder');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <AppIcon name="chevron-back" size={22} color="#1d2f5f" />
          </Pressable>
        </View>
        <Text style={styles.title}>New Reminder</Text>
        <Text style={styles.hint}>
          Fires on this device at the due time with your selected sound.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Reminder title"
          placeholderTextColor="#7b8798"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description"
          placeholderTextColor="#7b8798"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor="#7b8798"
          value={date}
          onChangeText={setDate}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Time (HH:MM)"
          placeholderTextColor="#7b8798"
          value={time}
          onChangeText={setTime}
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

        <PrimaryButton title={loading ? 'Saving...' : 'Create Reminder'} onPress={submit} disabled={loading} />
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e3ebf7',
    color: '#1d2f5f',
    fontSize: 16,
    minHeight: 48,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
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
});
