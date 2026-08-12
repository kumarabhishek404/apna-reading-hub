import { prisma } from "../lib/prisma";
import type { ReminderItem } from "../lib/types";

function mapReminder(r: {
  id: string;
  title: string;
  description: string;
  dueAt: Date;
  priority: string;
  repeat: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ReminderItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    dueAt: r.dueAt.toISOString(),
    priority: r.priority as ReminderItem["priority"],
    repeat: r.repeat as ReminderItem["repeat"],
    isCompleted: r.isCompleted,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getReminders(options?: {
  search?: string;
  upcoming?: boolean;
  includeCompleted?: boolean;
  userId?: string;
}) {
  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: {
      userId: options?.userId ?? undefined,
      AND: [
        options?.search
          ? {
              OR: [
                { title: { contains: options.search } },
                { description: { contains: options.search } },
              ],
            }
          : {},
        options?.includeCompleted ? {} : { isCompleted: false },
        options?.upcoming ? { dueAt: { gte: now } } : {},
      ],
    },
    orderBy: [{ isCompleted: "asc" }, { dueAt: "asc" }],
  });
  return reminders.map(mapReminder);
}

export async function getReminderById(id: string, userId?: string) {
  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || (userId && reminder.userId !== userId)) return null;
  return mapReminder(reminder);
}

export async function createReminder(data: {
  title: string;
  description?: string;
  dueAt: string;
  priority?: string;
  repeat?: string;
}, userId: string) {
  const reminder = await prisma.reminder.create({
    data: {
      userId,
      title: data.title,
      description: data.description ?? "",
      dueAt: new Date(data.dueAt),
      priority: data.priority ?? "medium",
      repeat: data.repeat ?? "none",
    },
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
  },
  userId?: string
) {
  const existing = await prisma.reminder.findUnique({ where: { id } });
  if (!existing || (userId && existing.userId !== userId)) throw new Error("Reminder not found");

  const reminder = await prisma.reminder.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      priority: data.priority,
      repeat: data.repeat,
      isCompleted: data.isCompleted,
    },
  });
  return mapReminder(reminder);
}

export async function deleteReminder(id: string, userId?: string) {
  const existing = await prisma.reminder.findUnique({ where: { id } });
  if (!existing || (userId && existing.userId !== userId)) throw new Error("Reminder not found");
  await prisma.reminder.delete({ where: { id } });
}

export async function toggleReminderComplete(id: string, userId?: string) {
  const current = await prisma.reminder.findUnique({ where: { id } });
  if (!current || (userId && current.userId !== userId)) return null;

  if (!current.isCompleted) {
    if (current.repeat !== "none") {
      const next = new Date(current.dueAt);
      if (current.repeat === "daily") next.setDate(next.getDate() + 1);
      else if (current.repeat === "weekly") next.setDate(next.getDate() + 7);
      else if (current.repeat === "monthly") next.setMonth(next.getMonth() + 1);
      return updateReminder(id, {
        dueAt: next.toISOString(),
        isCompleted: false,
      }, userId);
    }
    return updateReminder(id, { isCompleted: true }, userId);
  }

  return updateReminder(id, { isCompleted: false }, userId);
}

export async function getUpcomingReminders(limit = 5, userId?: string) {
  const now = new Date();
  const reminders = await prisma.reminder.findMany({
    where: { userId: userId ?? undefined, isCompleted: false, dueAt: { gte: now } },
    orderBy: { dueAt: "asc" },
    take: limit,
  });
  return reminders.map(mapReminder);
}
