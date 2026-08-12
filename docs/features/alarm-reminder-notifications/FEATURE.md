# Alarm & reminder device notifications

## What works
- Creating an alarm or reminder schedules a **local notification** on the device.
- At the scheduled time the notification shows and plays a sound:
  - **Device default**
  - **Apna Chime** (`assets/sounds/apna_chime.wav`)
  - **Apna Alert** (`assets/sounds/apna_alert.wav`)
- Alarms support weekday repeat; reminders support once / daily / weekly / monthly.
- Toggle off / complete clears related schedules; opening Home / Alarms / Reminders re-syncs from the API.

## Platform notes
- **Android:** uses notification channels per sound + `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`.
- **iOS:** uses local notification triggers with `sound: 'default'` or the custom filename.
- Custom sounds require a **native rebuild** after changing `app.json` `expo-notifications.sounds` (EAS Build or `npx expo run:android` / `run:ios`). Expo Go may fall back to the default sound for custom files.
- This is notification-based alerting (not a system Alarm Clock app). Silent mode / Focus / Do Not Disturb can still mute sounds depending on OS settings.

## Backend
- `Alarm.sound` and `Reminder.sound`: `default | apna_chime | apna_alert` (default `default`).
