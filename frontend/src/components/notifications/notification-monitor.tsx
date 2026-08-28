"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatTime12h } from "@/lib/datetime";

export function NotificationMonitor() {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function requestPermission() {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
    requestPermission();

    async function check() {
      const now = new Date();

      try {
        const [remindersRes, alarmsRes] = await Promise.all([
          apiFetch("/api/reminders"),
          apiFetch("/api/alarms?today=true"),
        ]);
        const remindersData = await remindersRes.json();
        const alarmsData = await alarmsRes.json();

        for (const reminder of remindersData.reminders ?? []) {
          if (reminder.isCompleted) continue;
          const due = new Date(reminder.dueAt);
          const key = `reminder-${reminder.id}-${due.toISOString().slice(0, 16)}`;
          if (
            due.getTime() <= now.getTime() &&
            due.getTime() > now.getTime() - 60000 &&
            !firedRef.current.has(key)
          ) {
            firedRef.current.add(key);
            toast(`Reminder: ${reminder.title}`, {
              description: reminder.description || "It's time!",
              duration: 10000,
            });
            if (Notification.permission === "granted") {
              new Notification("Apna Notes Reminder", {
                body: reminder.title,
                icon: "/icons/apna-notes-logo.png",
              });
            }
          }
        }

        const day = now.getDay();
        for (const alarm of alarmsData.alarms ?? []) {
          if (!alarm.isEnabled || !alarm.repeatDays.includes(day)) continue;
          const [h, m] = alarm.time.split(":").map(Number);
          const key = `alarm-${alarm.id}-${now.toDateString()}-${alarm.time}`;
          if (
            now.getHours() === h &&
            now.getMinutes() === m &&
            !firedRef.current.has(key)
          ) {
            firedRef.current.add(key);
            toast(`Alarm: ${alarm.title}`, {
              description: formatTime12h(alarm.time),
              duration: 15000,
            });
            if (Notification.permission === "granted") {
              new Notification("Apna Notes Alarm", {
                body: `${alarm.title} — ${formatTime12h(alarm.time)}`,
                icon: "/icons/apna-notes-logo.png",
              });
            }
          }
        }
      } catch {
        /* ignore */
      }

      if (firedRef.current.size > 200) firedRef.current.clear();
    }

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
