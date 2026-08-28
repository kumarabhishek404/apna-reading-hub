import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';
import {
  NOTIFICATION_SOUNDS,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import { playAlarmSound, stopAlarmSound } from '@/services/notifications';
import { colors } from '@/theme/colors';

type SoundPickerProps = {
  value: NotificationSoundId;
  onChange: (sound: NotificationSoundId) => void;
  accentColor?: string;
  label?: string;
  hint?: string;
};

export function SoundPicker({
  value,
  onChange,
  accentColor = colors.primary,
  label = 'Alarm sound',
  hint = 'Custom tracks ring for up to 30 seconds',
}: SoundPickerProps) {
  const [visible, setVisible] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      void stopAlarmSound();
    };
  }, []);

  const selectedSound = NOTIFICATION_SOUNDS.find((s) => s.id === value);

  async function handlePreview(soundId: NotificationSoundId) {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    await stopAlarmSound();
    setPreviewing(soundId);
    await playAlarmSound(soundId, 3);
    previewTimer.current = setTimeout(() => {
      setPreviewing(null);
      void stopAlarmSound();
    }, 3000);
  }

  async function closeModal() {
    setVisible(false);
    setPreviewing(null);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    await stopAlarmSound();
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <Pressable style={styles.dropdown} onPress={() => setVisible(true)}>
        <Text style={styles.dropdownText}>{selectedSound?.label || 'Select sound'}</Text>
        <AppIcon name="chevron-down" size={20} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          void closeModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sound</Text>
              <Pressable onPress={() => void closeModal()}>
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
                      void closeModal();
                    }}
                    style={[
                      styles.soundItem,
                      selected && {
                        backgroundColor: `${accentColor}14`,
                        borderColor: accentColor,
                      },
                    ]}
                  >
                    <View style={styles.soundItemContent}>
                      <View
                        style={[
                          styles.radioButton,
                          selected && { borderColor: accentColor },
                        ]}
                      >
                        {selected ? (
                          <View
                            style={[styles.radioButtonInner, { backgroundColor: accentColor }]}
                          />
                        ) : null}
                      </View>
                      <View style={styles.soundInfo}>
                        <Text
                          style={[
                            styles.soundName,
                            selected && { color: accentColor },
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text style={styles.soundDescription}>{option.description}</Text>
                      </View>
                    </View>
                    {option.assetModule ? (
                      <Pressable
                        style={styles.previewButton}
                        onPress={() => {
                          void handlePreview(option.id);
                        }}
                      >
                        <AppIcon
                          name={previewing === option.id ? 'stop' : 'play-outline'}
                          size={20}
                          color={previewing === option.id ? accentColor : colors.textMuted}
                        />
                      </Pressable>
                    ) : null}
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
  label: { fontSize: 14, fontWeight: '700' },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: -4,
  },
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
    marginBottom: 8,
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
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
