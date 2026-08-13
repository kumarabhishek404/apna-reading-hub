import * as Notifications from 'expo-notifications';
import * as Audio from 'expo-av';
import * as Asset from 'expo-asset';
import { AppState, Platform } from 'react-native';
import { getAlarms } from '@/api/alarms';
import { getReminders } from '@/api/reminders';
import {
  DEFAULT_NOTIFICATION_SOUND,
  NOTIFICATION_SOUNDS,
  getSoundOption,
  type NotificationSoundId,
} from '@/constants/notificationSounds';
import type { AlarmItem, ReminderItem } from '@/types';

// Audio playback for continuous alarm sounds
let activeSound: Audio.Sound | null = null;
let playbackTimeout: NodeJS.Timeout | null = null;
let isPlaying = false;

async function initializeAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    console.log('[Audio] Audio mode initialized successfully');
  } catch (error) {
    console.error('[Audio] Failed to initialize audio mode:', error);
  }
}

async function getSoundUri(fileName: string | null): Promise<string | null> {
  if (!fileName) {
    console.log('[Audio] No file name provided, using system sound');
    return null;
  }
  
  try {
    // Try to load from assets folder
    const asset = Asset.fromModule(fileName);
    console.log('[Audio] Loading sound asset', { fileName, asset });
    const download = await asset.downloadAsync();
    console.log('[Audio] Sound asset downloaded', { localUri: download.localUri });
    return download.localUri || null;
  } catch (error) {
    console.error('[Audio] Failed to get sound URI:', error);
    return null;
  }
}

async function playAlarmSound(soundId: NotificationSoundId, duration: number = 30) {
  console.log('[Audio] Playing alarm sound', { soundId, duration });
  try {
    // Stop any existing playback first
    await stopAlarmSound();

    const soundOption = getSoundOption(soundId);
    console.log('[Audio] Sound option', { id: soundOption.id, fileName: soundOption.fileName });
    
    // For custom sounds, use expo-av for continuous playback
    if (soundOption.fileName && soundOption.fileName !== 'default') {
      // Try to load from local assets
      try {
        const soundUri = await getSoundUri(soundOption.fileName);
        
        if (soundUri) {
          console.log('[Audio] Creating sound with URI', soundUri);
          const { sound } = await Audio.Sound.createAsync(
            { uri: soundUri },
            { 
              shouldPlay: true, 
              isLooping: true,
              volume: 1.0,
            }
          );
          
          activeSound = sound;
          isPlaying = true;
          
          // Set timeout to stop after specified duration
          playbackTimeout = setTimeout(async () => {
            console.log('[Audio] Duration timeout reached, stopping sound');
            await stopAlarmSound();
          }, duration * 1000);
          
          console.log(`[Audio] Playing ${soundId} for ${duration} seconds`);
          return;
        }
      } catch (audioError) {
        console.error('[Audio] Failed to play custom sound, falling back to system sound:', audioError);
      }
    }
    
    // Fallback to system notification sound
    console.log('[Audio] Using system notification sound');
  } catch (error) {
    console.error('[Audio] Failed to play alarm sound:', error);
  }
}

async function stopAlarmSound() {
  console.log('[Audio] Stopping alarm sound', { isPlaying, hasActiveSound: activeSound !== null });
  try {
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
      playbackTimeout = null;
    }

    if (activeSound) {
      await activeSound.stopAsync();
      await activeSound.unloadAsync();
      activeSound = null;
    }
    
    isPlaying = false;
    console.log('[Audio] Stopped alarm sound successfully');
  } catch (error) {
    console.error('[Audio] Failed to stop alarm sound:', error);
  }
}

function getActiveSoundState() {
  return { isPlaying, activeSound: activeSound !== null };
}

// Export audio control functions for use in other parts of the app
export { playAlarmSound, stopAlarmSound, getActiveSoundState };

// Handle app state changes to manage audio playback
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background' && isPlaying) {
    console.log('[Audio] App going to background, audio will continue playing');
  }
  if (nextAppState === 'active' && isPlaying) {
    console.log('[Audio] App came to foreground, audio is still playing');
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Initialize audio on app start
initializeAudio();

// Handle notification actions (like "Stop Alarm" button)
Notifications.addNotificationResponseReceivedListener(async (response) => {
  const { actionIdentifier, notification } = response;
  
  if (actionIdentifier === 'stop_alarm') {
    const data = notification.request.content.data as { kind?: string; id?: string };
    if (data?.kind === 'alarm' && data?.id) {
      // Stop audio playback
      await stopAlarmSound();
      // Cancel the alarm notification
      await Notifications.dismissNotificationAsync(notification.request.identifier);
      // Also cancel any follow-up notifications for this alarm
      await cancelNotificationsByPrefix(`alarm:${data.id}:`);
      console.log(`[Notifications] Stopped alarm ${data.id}`);
    }
  }
  
  if (actionIdentifier === 'stop_reminder') {
    const data = notification.request.content.data as { kind?: string; id?: string };
    if (data?.kind === 'reminder' && data?.id) {
      await stopAlarmSound();
      await Notifications.dismissNotificationAsync(notification.request.identifier);
      await cancelNotificationsByPrefix(`reminder:${data.id}:`);
      console.log(`[Notifications] Stopped reminder ${data.id}`);
    }
  }
});

// Handle notification presentation to start audio
Notifications.addNotificationReceivedListener(async (notification) => {
  const data = notification.request.content.data as { kind?: string; soundId?: NotificationSoundId };
  
  if (data?.kind === 'alarm' && data?.soundId) {
    // Start continuous audio playback for alarms
    await playAlarmSound(data.soundId, 30); // 30 seconds
  }
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

  // Set up iOS notification categories with stop buttons
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('alarm_category', {
      actions: [
        {
          identifier: 'stop_alarm',
          title: 'Stop Alarm',
          options: { destructive: true },
        },
      ],
    });

    await Notifications.setNotificationCategoryAsync('reminder_category', {
      actions: [
        {
          identifier: 'stop_reminder',
          title: 'Stop Reminder',
          options: { destructive: true },
        },
      ],
    });
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
        allowCriticalAlerts: true, // Enable critical alerts for alarms
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

  const androidAction = options.kind === 'alarm' 
    ? { title: 'Stop Alarm', actionId: 'stop_alarm' }
    : { title: 'Stop Reminder', actionId: 'stop_reminder' };

  return Notifications.scheduleNotificationAsync({
    identifier: options.identifier,
    content: {
      title: options.title,
      body: options.body,
      sound: notificationSoundValue(options.soundId),
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: options.data ?? {},
      // Add Android action button
      ...(Platform.OS === 'android' && {
        android: {
          channelId: soundOption.channelId,
          actions: [androidAction],
          // Make notification ongoing (not dismissible by swipe)
          ongoing: true,
          autoCancel: false,
        },
      }),
      // Add iOS category
      ...(Platform.OS === 'ios' && {
        categoryIdentifier: options.kind === 'alarm' ? 'alarm_category' : 'reminder_category',
      }),
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
        repeats: true,
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
      body: 'Alarm is ringing',
      soundId,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(day),
        hour: parsed.hour,
        minute: parsed.minute,
        repeats: true,
      },
      data: { kind: 'alarm', id: alarm.id, soundId, day },
      kind: 'alarm',
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
