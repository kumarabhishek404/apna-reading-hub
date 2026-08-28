import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_NOTIFICATION_SOUND,
  isNotificationSoundId,
  type NotificationSoundId,
} from '@/constants/notificationSounds';

const ALARM_KEY = 'apna.preferredAlarmSound';
const REMINDER_KEY = 'apna.preferredReminderSound';

async function readSound(key: string): Promise<NotificationSoundId> {
  const value = await AsyncStorage.getItem(key);
  return isNotificationSoundId(value) ? value : DEFAULT_NOTIFICATION_SOUND;
}

export async function getPreferredAlarmSound() {
  return readSound(ALARM_KEY);
}

export async function getPreferredReminderSound() {
  return readSound(REMINDER_KEY);
}

export async function setPreferredAlarmSound(sound: NotificationSoundId) {
  await AsyncStorage.setItem(ALARM_KEY, sound);
}

export async function setPreferredReminderSound(sound: NotificationSoundId) {
  await AsyncStorage.setItem(REMINDER_KEY, sound);
}
