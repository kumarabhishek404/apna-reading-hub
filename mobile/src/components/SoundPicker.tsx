import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  NOTIFICATION_SOUNDS,
  type NotificationSoundId,
} from '@/constants/notificationSounds';

type SoundPickerProps = {
  value: NotificationSoundId;
  onChange: (sound: NotificationSoundId) => void;
};

export function SoundPicker({ value, onChange }: SoundPickerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Notification sound</Text>
      <View style={styles.list}>
        {NOTIFICATION_SOUNDS.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.option, selected && styles.optionSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#1d2f5f' },
  list: { gap: 8 },
  option: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e3ebf7',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionSelected: {
    borderColor: '#22409a',
    backgroundColor: '#eef4ff',
  },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
  optionTitleSelected: { color: '#22409a' },
  optionDescription: { marginTop: 2, fontSize: 12, color: '#64748b' },
});
