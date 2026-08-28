"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeleton";
import { apiFetch } from "@/lib/api";
import { formatDueDate, isDueSoon, isOverdue, toDatetimeLocalValue } from "@/lib/datetime";
import { useDebounce } from "@/hooks/use-debounce";
import type { ReminderItem, ReminderPriority, ReminderRepeat } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITIES: ReminderPriority[] = ["low", "medium", "high"];
const REPEATS: { value: ReminderRepeat; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const priorityStyle: Record<ReminderPriority, string> = {
  low: "bg-brand/10 text-brand border-brand/20",
  medium: "bg-brand/15 text-brand border-brand/30",
  high: "bg-brand-orange/10 text-brand-orange border-brand-orange/30",
};

const emptyForm = () => ({
  title: "",
  description: "",
  dueAt: toDatetimeLocalValue(),
  priority: "medium" as ReminderPriority,
  repeat: "none" as ReminderRepeat,
});

export function RemindersPageClient() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [search, setSearch] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReminderItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (showCompleted) params.set("includeCompleted", "true");
    const res = await apiFetch(`/api/reminders?${params}`);
    const data = await res.json();
    setReminders(data.reminders ?? []);
    setLoading(false);
  }, [debouncedSearch, showCompleted]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(reminder: ReminderItem) {
    setEditing(reminder);
    setForm({
      title: reminder.title,
      description: reminder.description,
      dueAt: toDatetimeLocalValue(reminder.dueAt),
      priority: reminder.priority,
      repeat: reminder.repeat,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        dueAt: new Date(form.dueAt).toISOString(),
        priority: form.priority,
        repeat: form.repeat,
      };
      if (editing) {
        const res = await apiFetch("/api/reminders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        const data = await res.json();
        if (data.reminder) {
          setReminders((prev) =>
            prev.map((r) => (r.id === editing.id ? data.reminder : r))
          );
          toast.success("Reminder updated");
        }
      } else {
        const res = await apiFetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.reminder) {
          setReminders((prev) =>
            [...prev, data.reminder].sort(
              (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
            )
          );
          toast.success("Reminder added");
        }
      }
      setDialogOpen(false);
    } catch {
      toast.error("Could not save reminder");
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(id: string) {
    const res = await apiFetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "complete" }),
    });
    const data = await res.json();
    if (data.reminder) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? data.reminder : r)).filter((r) => showCompleted || !r.isCompleted)
      );
      toast.success(data.reminder.isCompleted ? "Reminder completed" : "Reminder updated");
    }
  }

  function handleDelete(id: string) {
    toast("Delete this reminder?", {
      action: {
        label: "Delete",
        onClick: async () => {
          await apiFetch(`/api/reminders?id=${id}`, { method: "DELETE" });
          setReminders((prev) => prev.filter((r) => r.id !== id));
          toast.success("Deleted successfully");
        },
      },
    });
  }

  const upcoming = reminders.filter((r) => !r.isCompleted);
  const completed = reminders.filter((r) => r.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Reminders</h1>
          <p className="text-muted">Never miss an important task again</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Reminder
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reminders..."
            className="pl-9"
          />
        </div>
        <Button
          variant={showCompleted ? "default" : "secondary"}
          onClick={() => setShowCompleted((v) => !v)}
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </Button>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Reminders Yet"
          description="Create your first reminder with priority, repeat options, and due dates."
          actionLabel="Add Reminder"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Upcoming
              </h2>
              {upcoming.map((reminder, i) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  index={i}
                  onComplete={() => toggleComplete(reminder.id)}
                  onEdit={() => openEdit(reminder)}
                  onDelete={() => handleDelete(reminder.id)}
                />
              ))}
            </section>
          )}
          {showCompleted && completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Completed
              </h2>
              {completed.map((reminder, i) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  index={i}
                  onComplete={() => toggleComplete(reminder.id)}
                  onEdit={() => openEdit(reminder)}
                  onDelete={() => handleDelete(reminder.id)}
                />
              ))}
            </section>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-border">
          <DialogHeader>
            <DialogTitle className="text-brand">
              {editing ? "Edit Reminder" : "New Reminder"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What do you need to remember?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional details..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueAt">Due date & time</Label>
              <Input
                id="dueAt"
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value as ReminderPriority })
                  }
                  className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat">Repeat</Label>
                <select
                  id="repeat"
                  value={form.repeat}
                  onChange={(e) =>
                    setForm({ ...form, repeat: e.target.value as ReminderRepeat })
                  }
                  className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                >
                  {REPEATS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Create reminder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReminderCard({
  reminder,
  index,
  onComplete,
  onEdit,
  onDelete,
}: {
  reminder: ReminderItem;
  index: number;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = !reminder.isCompleted && isOverdue(reminder.dueAt);
  const dueSoon = !reminder.isCompleted && isDueSoon(reminder.dueAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className={cn(
          reminder.isCompleted && "opacity-60",
          overdue && "border-brand-orange/40 ring-1 ring-brand-orange/20"
        )}
      >
        <CardContent className="flex gap-4 p-4">
          <button
            type="button"
            onClick={onComplete}
            className={cn(
              "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              reminder.isCompleted
                ? "border-brand bg-brand text-white"
                : "border-brand hover:bg-brand/10"
            )}
            aria-label={reminder.isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {reminder.isCompleted && <Check className="h-3.5 w-3.5" />}
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "font-medium text-brand",
                  reminder.isCompleted && "line-through"
                )}
              >
                {reminder.title}
              </p>
              <Badge variant="outline" className={priorityStyle[reminder.priority]}>
                {reminder.priority}
              </Badge>
              {reminder.repeat !== "none" && (
                <Badge variant="secondary">{reminder.repeat}</Badge>
              )}
              {overdue && <Badge variant="accent">Overdue</Badge>}
              {dueSoon && !overdue && <Badge variant="outline">Due soon</Badge>}
            </div>
            {reminder.description && (
              <p className="text-sm text-muted">{reminder.description}</p>
            )}
            <p className="text-xs text-muted">{formatDueDate(reminder.dueAt)}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
