import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { createAlarm } from '@/api/alarms';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundPicker } from '@/components/SoundPicker';
import { TimePicker } from '@/components/TimePicker';
import { TypeThemedScreen } from '@/components/TypeThemedScreen';
import { useToast } from '@/components/ToastContext';
import {
  DEFAULT_NOTIFICATION_SOUND,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import {
  ensureNotificationSetup,
  scheduleAlarmNotifications,
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

export default function CreateAlarmScreen() {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<NotificationSoundId>(DEFAULT_NOTIFICATION_SOUND);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { showSuccess, showError, showWarning } = useToast();

  const allDaysSelected = useMemo(() => repeatDays.length === 7, [repeatDays]);

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
    <TypeThemedScreen type={TYPE} title="New Alarm" scroll fallbackHref="/(tabs)/alarms">
      <Text style={styles.hint}>
        Scheduled on this device with your chosen sound. Keep notifications allowed for reliable ringing.
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

      <SoundPicker value={sound} onChange={setSound} accentColor={theme.primary} />

      <PrimaryButton
        title={loading ? 'Saving...' : 'Create Alarm'}
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
});
