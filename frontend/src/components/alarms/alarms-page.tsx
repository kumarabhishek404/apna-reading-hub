"use client";

import { useCallback, useEffect, useState } from "react";
import { AlarmClock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeleton";
import { apiFetch } from "@/lib/api";
import { DAY_LABELS, formatTime12h } from "@/lib/datetime";
import { useDebounce } from "@/hooks/use-debounce";
import type { AlarmItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyForm = () => ({
  title: "",
  time: "07:00",
  repeatDays: [0, 1, 2, 3, 4, 5, 6] as number[],
  isEnabled: true,
});

export function AlarmsPageClient() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [todayAlarms, setTodayAlarms] = useState<AlarmItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AlarmItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    const [allRes, todayRes] = await Promise.all([
      apiFetch(`/api/alarms?${params}`),
      apiFetch("/api/alarms?today=true"),
    ]);
    const allData = await allRes.json();
    const todayData = await todayRes.json();
    setAlarms(allData.alarms ?? []);
    setTodayAlarms(todayData.alarms ?? []);
    setLoading(false);
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(alarm: AlarmItem) {
    setEditing(alarm);
    setForm({
      title: alarm.title,
      time: alarm.time,
      repeatDays: alarm.repeatDays,
      isEnabled: alarm.isEnabled,
    });
    setDialogOpen(true);
  }

  function toggleDay(day: number) {
    setForm((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter((d) => d !== day)
        : [...prev.repeatDays, day].sort((a, b) => a - b),
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (form.repeatDays.length === 0) {
      toast.error("Select at least one repeat day");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        time: form.time,
        repeatDays: form.repeatDays,
        isEnabled: form.isEnabled,
      };
      if (editing) {
        const res = await apiFetch("/api/alarms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        const data = await res.json();
        if (data.alarm) {
          toast.success("Alarm updated");
        }
      } else {
        const res = await apiFetch("/api/alarms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.alarm) toast.success("Alarm added");
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Could not save alarm");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(alarm: AlarmItem) {
    const res = await apiFetch("/api/alarms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alarm.id, action: "toggle" }),
    });
    const data = await res.json();
    if (data.alarm) {
      setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? data.alarm : a)));
      setTodayAlarms((prev) =>
        data.alarm.isEnabled && data.alarm.repeatDays.includes(new Date().getDay())
          ? [...prev.filter((a) => a.id !== alarm.id), data.alarm].sort((a, b) =>
              a.time.localeCompare(b.time)
            )
          : prev.filter((a) => a.id !== alarm.id)
      );
      toast.success(data.alarm.isEnabled ? "Alarm enabled" : "Alarm disabled");
    }
  }

  function handleDelete(id: string) {
    toast("Delete this alarm?", {
      action: {
        label: "Delete",
        onClick: async () => {
          await apiFetch(`/api/alarms?id=${id}`, { method: "DELETE" });
          setAlarms((prev) => prev.filter((a) => a.id !== id));
          setTodayAlarms((prev) => prev.filter((a) => a.id !== id));
          toast.success("Deleted successfully");
        },
      },
    });
  }

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Alarms</h1>
          <p className="text-muted">Manage your daily alarms with ease</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Alarm
        </Button>
      </div>

      {!loading && todayAlarms.length > 0 && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
            <AlarmClock className="h-4 w-4 text-brand-orange" />
            Today&apos;s timeline
          </h2>
          <div className="relative space-y-0 border-l-2 border-brand/20 pl-6">
            {todayAlarms.map((alarm) => {
              const [h, m] = alarm.time.split(":").map(Number);
              const mins = h * 60 + m;
              const passed = mins < nowMinutes;
              return (
                <div key={alarm.id} className="relative pb-6 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-white",
                      passed ? "bg-muted" : "bg-brand-orange"
                    )}
                  />
                  <p className={cn("font-medium", passed ? "text-muted line-through" : "text-brand")}>
                    {formatTime12h(alarm.time)} — {alarm.title}
                  </p>
                  {!alarm.isEnabled && (
                    <Badge variant="outline" className="mt-1">
                      Disabled
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search alarms..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : alarms.length === 0 ? (
        <EmptyState
          icon={AlarmClock}
          title="No Alarms Yet"
          description="Set alarms with repeat days and get notified when it's time."
          actionLabel="Add Alarm"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm, i) => (
            <motion.div
              key={alarm.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className={cn(!alarm.isEnabled && "opacity-60")}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="rounded-2xl bg-brand/5 px-4 py-3 text-center">
                      <p className="text-xl font-bold text-brand">{formatTime12h(alarm.time)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand">{alarm.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {DAY_LABELS.map((label, dayIndex) => (
                          <span
                            key={label}
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                              alarm.repeatDays.includes(dayIndex)
                                ? "bg-brand text-white"
                                : "bg-brand/5 text-muted"
                            )}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={alarm.isEnabled}
                      onCheckedChange={() => toggleEnabled(alarm)}
                      aria-label="Toggle alarm"
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(alarm)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(alarm.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-border">
          <DialogHeader>
            <DialogTitle className="text-brand">
              {editing ? "Edit Alarm" : "New Alarm"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alarm-title">Label</Label>
              <Input
                id="alarm-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Wake up, Meeting..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alarm-time">Time</Label>
              <Input
                id="alarm-time"
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Repeat days</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, dayIndex) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(dayIndex)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                      form.repeatDays.includes(dayIndex)
                        ? "bg-brand text-white"
                        : "bg-brand/5 text-brand hover:bg-brand/10"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="alarm-enabled">Enabled</Label>
              <Switch
                id="alarm-enabled"
                checked={form.isEnabled}
                onCheckedChange={(checked) => setForm({ ...form, isEnabled: checked })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Create alarm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
