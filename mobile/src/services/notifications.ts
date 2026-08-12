import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAlarms } from '@/api/alarms';
import { getReminders } from '@/api/reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }
  return status === 'granted';
}

export async function scheduleLocalNotification(options: {
  title: string;
  body: string;
  triggerDate: Date;
  data?: Record<string, unknown>;
}) {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: options.title,
      body: options.body,
      sound: 'default',
      data: options.data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: options.triggerDate,
    },
  });
}

export async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function syncScheduledNotificationsFromBackend() {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const [alarmsRes, remindersRes] = await Promise.all([
    getAlarms(),
    getReminders({ upcoming: true, includeCompleted: false }),
  ]);

  const existingIds = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existingIds.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));

  const now = new Date();

  for (const alarm of alarmsRes.alarms.filter((item) => item.isEnabled)) {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const triggerDate = new Date(now);
    triggerDate.setHours(hours, minutes, 0, 0);

    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await scheduleLocalNotification({
      title: alarm.title,
      body: 'Alarm is ready to ring',
      triggerDate,
      data: { kind: 'alarm', id: alarm.id },
    });
  }

  for (const reminder of remindersRes.reminders) {
    const dueAt = new Date(reminder.dueAt);
    if (Number.isNaN(dueAt.getTime())) continue;

    if (dueAt.getTime() > now.getTime()) {
      await scheduleLocalNotification({
        title: reminder.title,
        body: reminder.description || 'A reminder is due now',
        triggerDate: dueAt,
        data: { kind: 'reminder', id: reminder.id },
      });
    }
  }
}
