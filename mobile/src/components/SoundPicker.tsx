import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Modal, ScrollView } from 'react-native';
import { AppIcon } from './AppIcon';
import {
  NOTIFICATION_SOUNDS,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import { colors } from '@/theme/colors';

type SoundPickerProps = {
  value: NotificationSoundId;
  onChange: (sound: NotificationSoundId) => void;
};

export function SoundPicker({ value, onChange }: SoundPickerProps) {
  const [visible, setVisible] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const selectedSound = NOTIFICATION_SOUNDS.find(s => s.id === value);

  const handlePreview = (soundId: string) => {
    setPreviewing(soundId);
    // In a real app, you would play the sound here
    setTimeout(() => setPreviewing(null), 2000);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Notification sound</Text>
      <Pressable style={styles.dropdown} onPress={() => setVisible(true)}>
        <Text style={styles.dropdownText}>{selectedSound?.label || 'Select sound'}</Text>
        <AppIcon name="chevron-down" size={20} color={colors.textMuted} />
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
              <Text style={styles.modalTitle}>Select Sound</Text>
              <Pressable onPress={() => setVisible(false)}>
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.soundList} showsVerticalScrollIndicator={false}>
              {NOTIFICATION_SOUNDS.map((option) => {
                const selected = option.id === value;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onChange(option.id);
                      setVisible(false);
                    }}
                    style={[styles.soundItem, selected && styles.soundItemSelected]}
                  >
                    <View style={styles.soundItemContent}>
                      <View style={[styles.radioButton, selected && styles.radioButtonSelected]}>
                        {selected && <View style={styles.radioButtonInner} />}
                      </View>
                      <View style={styles.soundInfo}>
                        <Text style={[styles.soundName, selected && styles.soundNameSelected]}>
                          {option.label}
                        </Text>
                        <Text style={styles.soundDescription}>{option.description}</Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.previewButton}
                      onPress={() => handlePreview(option.id)}
                    >
                      <AppIcon 
                        name={previewing === option.id ? 'volume-high' : 'play-outline'} 
                        size={20} 
                        color={previewing === option.id ? colors.primary : colors.textMuted} 
                      />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dropdownText: {
    fontSize: 15,
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
    maxHeight: '80%',
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
  soundList: {
    gap: 8,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  soundItemSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  soundItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  soundNameSelected: {
    color: colors.primary,
  },
  soundDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginLeft: 12,
  },
});
