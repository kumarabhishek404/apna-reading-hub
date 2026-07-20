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

export async function getAlarms(search?: string) {
  const alarms = await prisma.alarm.findMany({
    where: search
      ? { title: { contains: search } }
      : undefined,
    orderBy: [{ isEnabled: "desc" }, { time: "asc" }],
  });
  return alarms.map(mapAlarm);
}

export async function getAlarmById(id: string) {
  const alarm = await prisma.alarm.findUnique({ where: { id } });
  return alarm ? mapAlarm(alarm) : null;
}

export async function createAlarm(data: {
  title: string;
  time: string;
  repeatDays?: number[];
  isEnabled?: boolean;
}) {
  const alarm = await prisma.alarm.create({
    data: {
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
  }
) {
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

export async function deleteAlarm(id: string) {
  await prisma.alarm.delete({ where: { id } });
}

export async function toggleAlarmEnabled(id: string) {
  const current = await prisma.alarm.findUnique({ where: { id } });
  if (!current) return null;
  return updateAlarm(id, { isEnabled: !current.isEnabled });
}

export async function getTodayAlarms() {
  const day = new Date().getDay();
  const alarms = await prisma.alarm.findMany({
    where: { isEnabled: true },
    orderBy: { time: "asc" },
  });
  return alarms
    .map(mapAlarm)
    .filter((a) => a.repeatDays.includes(day));
}

export async function getUpcomingAlarms(limit = 10) {
  const alarms = await getAlarms();
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
