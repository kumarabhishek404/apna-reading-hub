import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createAlarm } from '@/api/alarms';
import { AppIcon } from '@/components/AppIcon';
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
  scheduleAlarmNotifications,
} from '@/services/notifications';

const DAY_OPTIONS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

function isValidTime(value: string) {
  return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

export default function CreateAlarmScreen() {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<NotificationSoundId>(DEFAULT_NOTIFICATION_SOUND);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; time?: string }>({});
  const { showSuccess, showError, showWarning } = useToast();

  const allDaysSelected = useMemo(() => repeatDays.length === 7, [repeatDays]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/alarms');
  };

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
    const newErrors: { title?: string; time?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Alarm title is required';
    }
    
    if (!isValidTime(time)) {
      newErrors.time = 'Use 24-hour time format (HH:MM)';
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

      const result = await createAlarm({
        title: title.trim(),
        time: time.trim(),
        repeatDays,
        isEnabled: true,
        sound,
      });

      await scheduleAlarmNotifications(result.alarm);
      setLoading(false);
      showSuccess('Alarm created successfully');
      router.back();
    } catch (error) {
      console.error('[Alarm Create] Failed', error);
      setLoading(false);
      showError('Could not create alarm. Please try again.');
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
        <Text style={styles.title}>New Alarm</Text>
        <Text style={styles.hint}>
          Scheduled on this device with your chosen sound. Keep notifications allowed for reliable ringing.
        </Text>

        <Input
          label="Alarm Label"
          placeholder="Enter alarm title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Input
          label="Time"
          placeholder="HH:MM"
          value={time}
          onChangeText={setTime}
          error={errors.time}
          autoCapitalize="none"
          keyboardType="numeric"
        />

        <Text style={styles.sectionLabel}>Repeat</Text>
        <View style={styles.daysRow}>
          {DAY_OPTIONS.map((day) => {
            const selected = repeatDays.includes(day.value);
            return (
              <Pressable
                key={day.value}
                onPress={() => toggleDay(day.value)}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
              >
                <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{day.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.meta}>{allDaysSelected ? 'Every day' : `${repeatDays.length} day(s) selected`}</Text>

        <SoundPicker value={sound} onChange={setSound} />

        <PrimaryButton title={loading ? 'Saving...' : 'Create Alarm'} onPress={submit} disabled={loading} />
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
  dayChipSelected: { backgroundColor: '#22409a', borderColor: '#22409a' },
  dayChipText: { fontWeight: '700', color: '#64748b' },
  dayChipTextSelected: { color: '#fff' },
  meta: { fontSize: 12, color: '#64748b', marginTop: -6 },
});
