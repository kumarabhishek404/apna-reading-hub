import { prisma } from "../lib/prisma";
import type { AlarmItem } from "../lib/types";

function mapAlarm(a: {
  id: string;
  title: string;
  time: string;
  repeatDays: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AlarmItem {
  return {
    id: a.id,
    title: a.title,
    time: a.time,
    repeatDays: a.repeatDays.split(",").map((d) => parseInt(d.trim(), 10)).filter((n) => !Number.isNaN(n)),
    isEnabled: a.isEnabled,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function serializeRepeatDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

export async function getAlarms(search?: string, userId?: string) {
  const alarms = await prisma.alarm.findMany({
    where: {
      userId: userId ?? undefined,
      ...(search ? { title: { contains: search } } : {}),
    },
    orderBy: [{ isEnabled: "desc" }, { time: "asc" }],
  });
  return alarms.map(mapAlarm);
}

export async function getAlarmById(id: string, userId?: string) {
  const alarm = await prisma.alarm.findUnique({ where: { id } });
  if (!alarm || (userId && alarm.userId !== userId)) return null;
  return mapAlarm(alarm);
}

export async function createAlarm(data: {
  title: string;
  time: string;
  repeatDays?: number[];
  isEnabled?: boolean;
}, userId: string) {
  const alarm = await prisma.alarm.create({
    data: {
      userId,
      title: data.title,
      time: data.time,
      repeatDays: serializeRepeatDays(data.repeatDays ?? [0, 1, 2, 3, 4, 5, 6]),
      isEnabled: data.isEnabled ?? true,
    },
  });
  return mapAlarm(alarm);
}

export async function updateAlarm(
  id: string,
  data: {
    title?: string;
    time?: string;
    repeatDays?: number[];
    isEnabled?: boolean;
  },
  userId?: string
) {
  const existing = await prisma.alarm.findUnique({ where: { id } });
  if (!existing || (userId && existing.userId !== userId)) throw new Error("Alarm not found");

  const alarm = await prisma.alarm.update({
    where: { id },
    data: {
      title: data.title,
      time: data.time,
      repeatDays: data.repeatDays ? serializeRepeatDays(data.repeatDays) : undefined,
      isEnabled: data.isEnabled,
    },
  });
  return mapAlarm(alarm);
}

export async function deleteAlarm(id: string, userId?: string) {
  const existing = await prisma.alarm.findUnique({ where: { id } });
  if (!existing || (userId && existing.userId !== userId)) throw new Error("Alarm not found");
  await prisma.alarm.delete({ where: { id } });
}

export async function toggleAlarmEnabled(id: string, userId?: string) {
  const current = await prisma.alarm.findUnique({ where: { id } });
  if (!current || (userId && current.userId !== userId)) return null;
  return updateAlarm(id, { isEnabled: !current.isEnabled }, userId);
}

export async function getTodayAlarms(userId?: string) {
  const day = new Date().getDay();
  const alarms = await prisma.alarm.findMany({
    where: { userId: userId ?? undefined, isEnabled: true },
    orderBy: { time: "asc" },
  });
  return alarms
    .map(mapAlarm)
    .filter((a) => a.repeatDays.includes(day));
}

export async function getUpcomingAlarms(limit = 10, userId?: string) {
  const alarms = await getAlarms(undefined, userId);
  const day = new Date().getDay();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  return alarms
    .filter((a) => a.isEnabled && a.repeatDays.includes(day))
    .map((a) => {
      const [h, m] = a.time.split(":").map(Number);
      return { ...a, minutes: h * 60 + m };
    })
    .filter((a) => a.minutes >= nowMinutes)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, limit)
    .map(({ minutes: _m, ...rest }) => rest);
}
