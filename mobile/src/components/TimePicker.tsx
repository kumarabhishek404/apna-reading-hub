import { useState } from 'react';
import { View, StyleSheet, Text, Pressable, Modal, ScrollView } from 'react-native';
import { AppIcon } from './AppIcon';
import { colors } from '@/theme/colors';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  accentColor?: string;
}

export function TimePicker({
  value,
  onChange,
  label,
  accentColor = colors.primary,
}: TimePickerProps) {
  const [visible, setVisible] = useState(false);
  const [hours, setHours] = useState(parseInt(value.split(':')[0]) || 7);
  const [minutes, setMinutes] = useState(parseInt(value.split(':')[1]) || 0);

  const hoursOptions = Array.from({ length: 24 }, (_, i) => i);
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i);

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    onChange(formatTime(hours, minutes));
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: accentColor }]}>{label}</Text> : null}
      <Pressable style={styles.timeDisplay} onPress={() => setVisible(true)}>
        <Text style={styles.timeText}>{value}</Text>
        <AppIcon name="time-outline" size={20} color={accentColor} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <Pressable onPress={() => setVisible(false)}>
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.timeDisplayLarge}>
              <Text style={[styles.timeTextLarge, { color: accentColor }]}>
                {formatTime(hours, minutes)}
              </Text>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hours</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {hoursOptions.map((h) => (
                    <Pressable
                      key={h}
                      style={[
                        styles.pickerItem,
                        hours === h && { backgroundColor: `${accentColor}1F` },
                      ]}
                      onPress={() => setHours(h)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          hours === h && { color: accentColor },
                        ]}
                      >
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minutes</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {minutesOptions.map((m) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.pickerItem,
                        minutes === m && { backgroundColor: `${accentColor}1F` },
                      ]}
                      onPress={() => setMinutes(m)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          minutes === m && { color: accentColor },
                        ]}
                      >
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable
              style={[styles.confirmButton, { backgroundColor: accentColor }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  timeDisplayLarge: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 20,
  },
  timeTextLarge: {
    fontSize: 48,
    fontWeight: '800',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerScroll: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
