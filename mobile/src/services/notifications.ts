import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAlarms } from '@/api/alarms';
import { getReminders } from '@/api/reminders';
import {
  DEFAULT_NOTIFICATION_SOUND,
  NOTIFICATION_SOUNDS,
  getSoundOption,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import type { AlarmItem, ReminderItem } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelsReady = false;

function notificationSoundValue(soundId: NotificationSoundId): string | boolean {
  const option = getSoundOption(soundId);
  return option.fileName ?? 'default';
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android' || channelsReady) return;

  await Promise.all(
    NOTIFICATION_SOUNDS.map((option) =>
      Notifications.setNotificationChannelAsync(option.channelId, {
        name: option.label,
        description: option.description,
        importance: Notifications.AndroidImportance.MAX,
        sound: option.fileName ?? 'default',
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
          flags: {
            enforceAudibility: true,
            requestHardwareAudioVideoSynchronization: false,
          },
        },
      }),
    ),
  );

  channelsReady = true;
}

export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await ensureAndroidChannels();
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowDisplayInCarPlay: false,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: true,
        allowProvisional: false,
      },
    });
    status = requested.status;
  }

  return status === 'granted';
}

export async function ensureNotificationSetup() {
  return requestNotificationPermissions();
}

type ScheduleOptions = {
  identifier: string;
  title: string;
  body: string;
  soundId: NotificationSoundId;
  trigger: Notifications.NotificationTriggerInput;
  data?: Record<string, unknown>;
};

async function scheduleWithSound(options: ScheduleOptions) {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const soundOption = getSoundOption(options.soundId);
  const trigger =
    Platform.OS === 'android' && options.trigger && typeof options.trigger === 'object'
      ? { ...options.trigger, channelId: soundOption.channelId }
      : options.trigger;

  return Notifications.scheduleNotificationAsync({
    identifier: options.identifier,
    content: {
      title: options.title,
      body: options.body,
      sound: notificationSoundValue(options.soundId),
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: options.data ?? {},
    },
    trigger,
  });
}

function parseAlarmTime(time: string): { hour: number; minute: number } | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/** JS Date.getDay() 0–6 → Expo weekly weekday 1–7 (Sunday = 1). */
function toExpoWeekday(jsDay: number) {
  return jsDay + 1;
}

export async function cancelNotificationsByPrefix(prefix: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(prefix))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function scheduleAlarmNotifications(alarm: AlarmItem) {
  if (!alarm.isEnabled) {
    await cancelNotificationsByPrefix(`alarm:${alarm.id}:`);
    return;
  }

  const parsed = parseAlarmTime(alarm.time);
  if (!parsed) return;

  const soundId = (alarm.sound ?? DEFAULT_NOTIFICATION_SOUND) as NotificationSoundId;
  const days = alarm.repeatDays?.length ? alarm.repeatDays : [0, 1, 2, 3, 4, 5, 6];

  await cancelNotificationsByPrefix(`alarm:${alarm.id}:`);

  // All days → one daily trigger; otherwise one weekly trigger per selected day.
  if (days.length === 7) {
    await scheduleWithSound({
      identifier: `alarm:${alarm.id}:daily`,
      title: alarm.title,
      body: 'Alarm is ringing',
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
      },
      data: { kind: 'alarm', id: alarm.id, soundId },
    });
    return;
  }

  for (const day of days) {
    await scheduleWithSound({
      identifier: `alarm:${alarm.id}:day:${day}`,
      title: alarm.title,
      body: 'Alarm is ringing',
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(day),
        hour: parsed.hour,
        minute: parsed.minute,
      },
      data: { kind: 'alarm', id: alarm.id, soundId, day },
    });
  }
}

export async function scheduleReminderNotifications(reminder: ReminderItem) {
  await cancelNotificationsByPrefix(`reminder:${reminder.id}`);

  if (reminder.isCompleted) return;

  const soundId = (reminder.sound ?? DEFAULT_NOTIFICATION_SOUND) as NotificationSoundId;
  const dueAt = new Date(reminder.dueAt);
  if (Number.isNaN(dueAt.getTime())) return;

  const title = reminder.title;
  const body = reminder.description?.trim() || 'Reminder is due now';

  if (reminder.repeat === 'daily') {
    await scheduleWithSound({
      identifier: `reminder:${reminder.id}:daily`,
      title,
      body,
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: dueAt.getHours(),
        minute: dueAt.getMinutes(),
      },
      data: { kind: 'reminder', id: reminder.id, soundId },
    });
    return;
  }

  if (reminder.repeat === 'weekly') {
    await scheduleWithSound({
      identifier: `reminder:${reminder.id}:weekly`,
      title,
      body,
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(dueAt.getDay()),
        hour: dueAt.getHours(),
        minute: dueAt.getMinutes(),
      },
      data: { kind: 'reminder', id: reminder.id, soundId },
    });
    return;
  }

  if (reminder.repeat === 'monthly') {
    await scheduleWithSound({
      identifier: `reminder:${reminder.id}:monthly`,
      title,
      body,
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: dueAt.getDate(),
        hour: dueAt.getHours(),
        minute: dueAt.getMinutes(),
      },
      data: { kind: 'reminder', id: reminder.id, soundId },
    });
    return;
  }

  // One-shot
  if (dueAt.getTime() <= Date.now()) return;

  await scheduleWithSound({
    identifier: `reminder:${reminder.id}:once`,
    title,
    body,
    soundId,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueAt,
    },
    data: { kind: 'reminder', id: reminder.id, soundId },
  });
}

export async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function syncScheduledNotificationsFromBackend() {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.warn('[Notifications] Permission not granted — alarms/reminders will not ring');
    return { scheduled: 0, permissionGranted: false };
  }

  const [alarmsRes, remindersRes] = await Promise.all([
    getAlarms(),
    getReminders({ includeCompleted: false }),
  ]);

  // Clear previous app schedules, then rebuild from server state.
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );

  for (const alarm of alarmsRes.alarms) {
    await scheduleAlarmNotifications(alarm);
  }

  for (const reminder of remindersRes.reminders) {
    await scheduleReminderNotifications(reminder);
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return { scheduled: scheduled.length, permissionGranted: true };
}
