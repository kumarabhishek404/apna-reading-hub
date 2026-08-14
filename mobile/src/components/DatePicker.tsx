import { useState } from 'react';
import { View, StyleSheet, Text, Pressable, Modal, ScrollView } from 'react-native';
import { AppIcon } from './AppIcon';
import { colors } from '@/theme/colors';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  label?: string;
  accentColor?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  accentColor = colors.primary,
}: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  
  // Parse date
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month, day };
  };
  
  const initialDate = parseDate(value);
  const [year, setYear] = useState(initialDate.year);
  const [month, setMonth] = useState(initialDate.month);
  const [day, setDay] = useState(initialDate.day);

  const currentYear = new Date().getFullYear();
  const yearsOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const monthsOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatDateDisplay = (y: number, m: number, d: number) => {
    return `${monthNames[m - 1]} ${d}, ${y}`;
  };

  const formatDateISO = (y: number, m: number, d: number) => {
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    onChange(formatDateISO(year, month, day));
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: accentColor }]}>{label}</Text> : null}
      <Pressable style={styles.dateDisplay} onPress={() => setVisible(true)}>
        <Text style={styles.dateText}>{formatDateDisplay(year, month, day)}</Text>
        <AppIcon name="calendar-outline" size={20} color={accentColor} />
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
              <Text style={styles.modalTitle}>Select Date</Text>
              <Pressable onPress={() => setVisible(false)}>
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.dateDisplayLarge}>
              <Text style={[styles.dateTextLarge, { color: accentColor }]}>
                {formatDateDisplay(year, month, day)}
              </Text>
            </View>

            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {yearsOptions.map((y) => (
                    <Pressable
                      key={y}
                      style={[
                        styles.pickerItem,
                        year === y && { backgroundColor: `${accentColor}1F` },
                      ]}
                      onPress={() => setYear(y)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          year === y && { color: accentColor },
                        ]}
                      >
                        {y}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {monthsOptions.map((m) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.pickerItem,
                        month === m && { backgroundColor: `${accentColor}1F` },
                      ]}
                      onPress={() => setMonth(m)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          month === m && { color: accentColor },
                        ]}
                      >
                        {monthNames[m - 1]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {daysOptions.map((d) => (
                    <Pressable
                      key={d}
                      style={[
                        styles.pickerItem,
                        day === d && { backgroundColor: `${accentColor}1F` },
                      ]}
                      onPress={() => setDay(d)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          day === d && { color: accentColor },
                        ]}
                      >
                        {d}
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
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateText: {
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
  dateDisplayLarge: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 20,
  },
  dateTextLarge: {
    fontSize: 32,
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
