"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SOUND_OPTIONS = [
  { id: "default", label: "Device default" },
  { id: "apna_chime", label: "Apna Chime" },
  { id: "apna_alert", label: "Apna Alert" },
] as const;

function readSound(key: string) {
  if (typeof window === "undefined") return "apna_chime";
  return window.localStorage.getItem(key) || "apna_chime";
}

export default function SettingsPage() {
  const [alarmSound, setAlarmSound] = useState("apna_chime");
  const [reminderSound, setReminderSound] = useState("apna_chime");

  useEffect(() => {
    setAlarmSound(readSound("apna.preferredAlarmSound"));
    setReminderSound(readSound("apna.preferredReminderSound"));
  }, []);

  function save(key: string, value: string, setter: (value: string) => void) {
    window.localStorage.setItem(key, value);
    setter(value);
    toast.success("Sound preference saved");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Settings</h1>
        <p className="text-muted">Match the mobile app: sounds live here, not on each alarm.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-alarm" />
            Alarm sound
          </CardTitle>
          <CardDescription>Used when you capture or create an alarm</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SOUND_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={alarmSound === option.id ? "default" : "outline"}
              onClick={() => save("apna.preferredAlarmSound", option.id, setAlarmSound)}
            >
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-reminder" />
            Reminder sound
          </CardTitle>
          <CardDescription>Used when you capture or create a reminder</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SOUND_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={reminderSound === option.id ? "default" : "outline"}
              onClick={() => save("apna.preferredReminderSound", option.id, setReminderSound)}
            >
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
