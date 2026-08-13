/**
 * Shared notification sound catalog for alarms & reminders.
 * Custom WAV files must also be listed in app.json expo-notifications plugin.
 * After changing sounds, rebuild the native app (EAS / expo run).
 */
export type NotificationSoundId = 'default' | 'apna_chime' | 'apna_alert' | 'apna_melody' | 'apna_rise';

export type NotificationSoundOption = {
  id: NotificationSoundId;
  label: string;
  description: string;
  /** Filename for custom sounds (null = OS default). */
  fileName: string | null;
  channelId: string;
};

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    id: 'default',
    label: 'Device default',
    description: 'System notification sound',
    fileName: null,
    channelId: 'apna-sound-default',
  },
  {
    id: 'apna_chime',
    label: 'Apna Chime',
    description: 'Soft app chime',
    fileName: '../../assets/sounds/apna_chime.wav',
    channelId: 'apna-sound-chime',
  },
  {
    id: 'apna_alert',
    label: 'Apna Alert',
    description: 'Louder app alert',
    fileName: '../../assets/sounds/apna_alert.wav',
    channelId: 'apna-sound-alert',
  },
  {
    id: 'apna_melody',
    label: 'Apna Melody',
    description: 'Melodic alarm tone',
    fileName: '../../assets/sounds/apna_alert.wav', // Using existing file as placeholder
    channelId: 'apna-sound-melody',
  },
  {
    id: 'apna_rise',
    label: 'Apna Rise',
    description: 'Gradually rising tone',
    fileName: '../../assets/sounds/apna_chime.wav', // Using existing file as placeholder
    channelId: 'apna-sound-rise',
  },
];

export const DEFAULT_NOTIFICATION_SOUND: NotificationSoundId = 'default';

export function getSoundOption(soundId?: string | null): NotificationSoundOption {
  return (
    NOTIFICATION_SOUNDS.find((item) => item.id === soundId) ??
    NOTIFICATION_SOUNDS[0]
  );
}

export function isNotificationSoundId(value: unknown): value is NotificationSoundId {
  return typeof value === 'string' && NOTIFICATION_SOUNDS.some((item) => item.id === value);
}
