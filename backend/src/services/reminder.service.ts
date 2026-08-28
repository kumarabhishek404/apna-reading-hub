import { Reminder } from "../models";
import type { ReminderItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import { LIST_LIMIT, ownedFilter, toIso } from "../lib/query";

function mapReminder(r: any): ReminderItem {
  return {
    id: r._id.toString(),
    title: r.title,
    description: r.description,
    dueAt: toIso(r.dueAt),
    priority: r.priority as ReminderItem["priority"],
    repeat: r.repeat as ReminderItem["repeat"],
    isCompleted: r.isCompleted,
    sound: (r.sound || "default") as ReminderItem["sound"],
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  };
}

export async function getReminders(options?: {
  search?: string;
  upcoming?: boolean;
  includeCompleted?: boolean;
  userId?: string;
}) {
  const now = new Date();
  const filter: Record<string, unknown> = {};

  if (options?.userId) filter.userId = options.userId;
  if (!options?.includeCompleted) filter.isCompleted = false;
  if (options?.upcoming) filter.dueAt = { $gte: now };
  if (options?.search) {
    filter.$or = [
      { title: { $regex: options.search, $options: "i" } },
      { description: { $regex: options.search, $options: "i" } },
    ];
  }

  const reminders = await Reminder.find(filter)
    .sort({ isCompleted: 1, dueAt: 1 })
    .limit(LIST_LIMIT)
    .lean();

  return reminders.map(mapReminder);
}

export async function getReminderById(id: string, userId?: string) {
  const reminder = await Reminder.findOne(ownedFilter(id, userId)).lean();
  if (!reminder) return null;
  return mapReminder(reminder);
}

export async function createReminder(
  data: {
    title: string;
    description?: string;
    dueAt: string;
    priority?: string;
    repeat?: string;
    sound?: string;
  },
  userId: string
) {
  const reminder = await Reminder.create({
    userId,
    title: data.title,
    description: data.description ?? "",
    dueAt: new Date(data.dueAt),
    priority: data.priority ?? "medium",
    repeat: data.repeat ?? "none",
    sound: data.sound ?? "default",
  });
  return mapReminder(reminder);
}

export async function updateReminder(
  id: string,
  data: {
    title?: string;
    description?: string;
    dueAt?: string;
    priority?: string;
    repeat?: string;
    isCompleted?: boolean;
    sound?: string;
  },
  userId?: string
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.dueAt !== undefined) updateData.dueAt = new Date(data.dueAt);
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.repeat !== undefined) updateData.repeat = data.repeat;
  if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
  if (data.sound !== undefined) updateData.sound = data.sound;

  const reminder = await Reminder.findOneAndUpdate(ownedFilter(id, userId), updateData, {
    new: true,
  }).lean();
  if (!reminder) throw new HttpError(404, "Reminder not found");
  return mapReminder(reminder);
}

export async function deleteReminder(id: string, userId?: string) {
  const result = await Reminder.findOneAndDelete(ownedFilter(id, userId)).lean();
  if (!result) throw new HttpError(404, "Reminder not found");
}

export async function toggleReminderComplete(id: string, userId?: string) {
  const current = await Reminder.findOne(ownedFilter(id, userId)).lean();
  if (!current) return null;

  if (!current.isCompleted && current.repeat !== "none") {
    const next = new Date(current.dueAt);
    if (current.repeat === "daily") next.setDate(next.getDate() + 1);
    else if (current.repeat === "weekly") next.setDate(next.getDate() + 7);
    else if (current.repeat === "monthly") next.setMonth(next.getMonth() + 1);
    return updateReminder(
      id,
      {
        dueAt: next.toISOString(),
        isCompleted: false,
      },
      userId
    );
  }

  return updateReminder(id, { isCompleted: !current.isCompleted }, userId);
}

export async function getUpcomingReminders(limit = 5, userId?: string) {
  const now = new Date();
  const filter: Record<string, unknown> = {
    isCompleted: false,
    dueAt: { $gte: now },
  };
  if (userId) filter.userId = userId;

  const reminders = await Reminder.find(filter).sort({ dueAt: 1 }).limit(limit).lean();
  return reminders.map(mapReminder);
}
