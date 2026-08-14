/**
 * Shared notification sound catalog for alarms & reminders.
 * Custom WAV files must also be listed in app.json expo-notifications plugin.
 * After changing sounds, rebuild the native app (EAS / expo run).
 *
 * Files are ~30s so the OS can ring for the full alarm window (iOS max is 30s).
 */
export type NotificationSoundId = 'default' | 'apna_chime' | 'apna_alert';

export type NotificationSoundOption = {
  id: NotificationSoundId;
  label: string;
  description: string;
  /** Bundled asset for in-app / continuous playback (null = OS default). */
  assetModule: number | null;
  /** Filename registered with expo-notifications (null = OS default). */
  nativeFileName: string | null;
  channelId: string;
  /** How long the alarm should keep ringing (seconds). */
  durationSeconds: number;
};

export const ALARM_RING_SECONDS = 30;

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    id: 'default',
    label: 'Device default',
    description: 'System notification sound',
    assetModule: null,
    nativeFileName: null,
    channelId: 'apna-sound-default',
    durationSeconds: ALARM_RING_SECONDS,
  },
  {
    id: 'apna_chime',
    label: 'Apna Chime',
    description: 'Soft 30s chime loop for alarms',
    assetModule: require('../../assets/sounds/apna_chime.wav'),
    nativeFileName: 'apna_chime.wav',
    channelId: 'apna-sound-chime',
    durationSeconds: ALARM_RING_SECONDS,
  },
  {
    id: 'apna_alert',
    label: 'Apna Alert',
    description: 'Urgent 30s two-tone alarm',
    assetModule: require('../../assets/sounds/apna_alert.wav'),
    nativeFileName: 'apna_alert.wav',
    channelId: 'apna-sound-alert',
    durationSeconds: ALARM_RING_SECONDS,
  },
];

export const DEFAULT_NOTIFICATION_SOUND: NotificationSoundId = 'apna_chime';

export function getSoundOption(soundId?: string | null): NotificationSoundOption {
  return (
    NOTIFICATION_SOUNDS.find((item) => item.id === soundId) ??
    NOTIFICATION_SOUNDS.find((item) => item.id === DEFAULT_NOTIFICATION_SOUND) ??
    NOTIFICATION_SOUNDS[0]
  );
}

export function isNotificationSoundId(value: unknown): value is NotificationSoundId {
  return typeof value === 'string' && NOTIFICATION_SOUNDS.some((item) => item.id === value);
}
