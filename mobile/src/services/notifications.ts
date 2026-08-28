import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { getAlarms } from '@/api/alarms';
import { getReminders } from '@/api/reminders';
import {
  ALARM_RING_SECONDS,
  NOTIFICATION_SOUNDS,
  getSoundOption,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import { getPreferredAlarmSound, getPreferredReminderSound } from '@/lib/notificationSoundPreference';
import type { AlarmItem, ReminderItem } from '@/types';

const BACKGROUND_NOTIFICATION_TASK = 'APNA_BACKGROUND_NOTIFICATION_TASK';
const ALARM_CATEGORY = 'alarm_category';
const REMINDER_CATEGORY = 'reminder_category';
const STOP_ALARM_ACTION = 'stop_alarm';
const STOP_REMINDER_ACTION = 'stop_reminder';

let activeSound: Audio.Sound | null = null;
let playbackTimeout: ReturnType<typeof setTimeout> | null = null;
let isPlaying = false;
let channelsReady = false;
let categoriesReady = false;

async function initializeAudio() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('[Audio] Failed to initialize audio mode:', error);
  }
}

async function resolveCustomSoundSource(soundId: NotificationSoundId) {
  const option = getSoundOption(soundId);
  if (!option.assetModule) return null;

  const asset = Asset.fromModule(option.assetModule);
  await asset.downloadAsync();
  if (asset.localUri) return { uri: asset.localUri };
  return option.assetModule;
}

export async function playAlarmSound(
  soundId: NotificationSoundId,
  duration: number = ALARM_RING_SECONDS
) {
  try {
    await stopAlarmSound();
    await initializeAudio();

    const source = await resolveCustomSoundSource(soundId);
    if (!source) {
      // Device default — OS notification sound handles playback.
      return;
    }

    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      isLooping: true,
      volume: 1.0,
    });

    activeSound = sound;
    isPlaying = true;

    playbackTimeout = setTimeout(() => {
      void stopAlarmSound();
    }, Math.max(1, duration) * 1000);
  } catch (error) {
    console.error('[Audio] Failed to play alarm sound:', error);
  }
}

export async function stopAlarmSound() {
  try {
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
      playbackTimeout = null;
    }

    if (activeSound) {
      try {
        await activeSound.stopAsync();
      } catch {
        // ignore
      }
      try {
        await activeSound.unloadAsync();
      } catch {
        // ignore
      }
      activeSound = null;
    }

    isPlaying = false;
  } catch (error) {
    console.error('[Audio] Failed to stop alarm sound:', error);
  }
}

export function getActiveSoundState() {
  return { isPlaying, activeSound: activeSound !== null };
}

async function handleStopAction(
  actionIdentifier: string,
  notification: Notifications.Notification
) {
  const data = (notification.request.content.data ?? {}) as {
    kind?: string;
    id?: string;
  };

  if (actionIdentifier === STOP_ALARM_ACTION) {
    await stopAlarmSound();
    try {
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    } catch {
      // ignore
    }
    if (data?.id) {
      await cancelNotificationsByPrefix(`alarm:${data.id}:`);
    }
    return;
  }

  if (actionIdentifier === STOP_REMINDER_ACTION) {
    await stopAlarmSound();
    try {
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    } catch {
      // ignore
    }
    if (data?.id) {
      await cancelNotificationsByPrefix(`reminder:${data.id}`);
    }
  }
}

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background' && isPlaying) {
    // Keep looping via staysActiveInBackground until timeout / Stop.
  }
});

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as {
      kind?: string;
      soundId?: NotificationSoundId;
    };

    // When the OS delivers the alarm while the app process is alive,
    // reinforce with a looping track capped at ALARM_RING_SECONDS.
    if (data?.kind === 'alarm' && data?.soundId) {
      void playAlarmSound(data.soundId, ALARM_RING_SECONDS);
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

void initializeAudio();

Notifications.addNotificationResponseReceivedListener(async (response) => {
  const { actionIdentifier, notification } = response;
  if (
    actionIdentifier === STOP_ALARM_ACTION ||
    actionIdentifier === STOP_REMINDER_ACTION
  ) {
    await handleStopAction(actionIdentifier, notification);
  }
});

Notifications.addNotificationReceivedListener(async (notification) => {
  const data = notification.request.content.data as {
    kind?: string;
    soundId?: NotificationSoundId;
  };

  if (data?.kind === 'alarm' && data?.soundId) {
    await playAlarmSound(data.soundId, ALARM_RING_SECONDS);
  }
});

/**
 * Background task so "Stop Alarm" can run without bringing the app to the foreground.
 * Must be defined at module scope (before registerTaskAsync).
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Notifications] Background task error:', error);
    return;
  }

  const payload = data as {
    actionIdentifier?: string;
    notification?: Notifications.Notification;
  } | null;

  const actionIdentifier = payload?.actionIdentifier;
  const notification = payload?.notification;
  if (!actionIdentifier || !notification) return;

  if (
    actionIdentifier === STOP_ALARM_ACTION ||
    actionIdentifier === STOP_REMINDER_ACTION
  ) {
    await handleStopAction(actionIdentifier, notification);
  }
});

async function ensureBackgroundTaskRegistered() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_NOTIFICATION_TASK
    );
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    }
  } catch (error) {
    // Simulator / Expo Go may not support background notification tasks.
    console.warn('[Notifications] Could not register background task:', error);
  }
}

function notificationSoundValue(soundId: NotificationSoundId): string | boolean {
  const option = getSoundOption(soundId);
  return option.nativeFileName ?? 'default';
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android' || channelsReady) return;

  await Promise.all(
    NOTIFICATION_SOUNDS.map((option) =>
      Notifications.setNotificationChannelAsync(option.channelId, {
        name: option.label,
        description: option.description,
        importance: Notifications.AndroidImportance.MAX,
        sound: option.nativeFileName ?? 'default',
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
      })
    )
  );

  channelsReady = true;
}

async function ensureNotificationCategories() {
  if (categoriesReady) return;

  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY, [
    {
      identifier: STOP_ALARM_ACTION,
      buttonTitle: 'Stop Alarm',
      options: {
        opensAppToForeground: false,
        isDestructive: true,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
    {
      identifier: STOP_REMINDER_ACTION,
      buttonTitle: 'Stop',
      options: {
        opensAppToForeground: false,
        isDestructive: true,
      },
    },
  ]);

  categoriesReady = true;
}

export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await ensureAndroidChannels();
  }

  await ensureNotificationCategories();
  await ensureBackgroundTaskRegistered();

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
  kind?: 'alarm' | 'reminder';
};

async function scheduleWithSound(options: ScheduleOptions) {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const soundOption = getSoundOption(options.soundId);
  const trigger =
    Platform.OS === 'android' && options.trigger && typeof options.trigger === 'object'
      ? { ...options.trigger, channelId: soundOption.channelId }
      : options.trigger;

  const categoryIdentifier =
    options.kind === 'alarm' ? ALARM_CATEGORY : REMINDER_CATEGORY;

  return Notifications.scheduleNotificationAsync({
    identifier: options.identifier,
    content: {
      title: options.title,
      body: options.body,
      sound: notificationSoundValue(options.soundId),
      priority: Notifications.AndroidNotificationPriority.MAX,
      categoryIdentifier,
      data: {
        ...(options.data ?? {}),
        soundId: options.soundId,
        ringSeconds: ALARM_RING_SECONDS,
      },
      ...(Platform.OS === 'android'
        ? {
            sticky: true,
            autoDismiss: false,
          }
        : {}),
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
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

export async function scheduleAlarmNotifications(alarm: AlarmItem) {
  if (!alarm.isEnabled) {
    await cancelNotificationsByPrefix(`alarm:${alarm.id}:`);
    return;
  }

  const parsed = parseAlarmTime(alarm.time);
  if (!parsed) return;

  const soundId = await getPreferredAlarmSound();
  const days = alarm.repeatDays?.length ? alarm.repeatDays : [0, 1, 2, 3, 4, 5, 6];

  await cancelNotificationsByPrefix(`alarm:${alarm.id}:`);

  if (alarm.oneShotDate) {
    const [year, month, day] = alarm.oneShotDate.split('-').map(Number);
    if (year && month && day) {
      const when = new Date(year, month - 1, day, parsed.hour, parsed.minute, 0, 0);
      if (when.getTime() > Date.now()) {
        await scheduleWithSound({
          identifier: `alarm:${alarm.id}:once`,
          title: alarm.title,
          body: 'Alarm is ringing — tap Stop Alarm to silence',
          soundId,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
          },
          data: { kind: 'alarm', id: alarm.id, soundId },
          kind: 'alarm',
        });
      }
    }
    return;
  }

  if (days.length === 7) {
    await scheduleWithSound({
      identifier: `alarm:${alarm.id}:daily`,
      title: alarm.title,
      body: 'Alarm is ringing — tap Stop Alarm to silence',
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
      },
      data: { kind: 'alarm', id: alarm.id, soundId },
      kind: 'alarm',
    });
    return;
  }

  for (const day of days) {
    await scheduleWithSound({
      identifier: `alarm:${alarm.id}:day:${day}`,
      title: alarm.title,
      body: 'Alarm is ringing — tap Stop Alarm to silence',
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(day),
        hour: parsed.hour,
        minute: parsed.minute,
      },
      data: { kind: 'alarm', id: alarm.id, soundId, day },
      kind: 'alarm',
    });
  }
}

export async function scheduleReminderNotifications(reminder: ReminderItem) {
  await cancelNotificationsByPrefix(`reminder:${reminder.id}`);

  if (reminder.isCompleted) return;

  const soundId = await getPreferredReminderSound();
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
      kind: 'reminder',
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
      kind: 'reminder',
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
      kind: 'reminder',
    });
    return;
  }

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
    kind: 'reminder',
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

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
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
