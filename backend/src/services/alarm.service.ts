import { Alarm } from "../models";
import type { AlarmItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import { LIST_LIMIT, toIso } from "../lib/query";

function parseRepeatDays(value: string | undefined): number[] {
  return (value || "")
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((n) => !Number.isNaN(n));
}

function mapAlarm(a: any): AlarmItem {
  return {
    id: a._id.toString(),
    title: a.title,
    time: a.time,
    repeatDays: parseRepeatDays(a.repeatDays),
    isEnabled: a.isEnabled,
    sound: (a.sound || "default") as AlarmItem["sound"],
    createdAt: toIso(a.createdAt),
    updatedAt: toIso(a.updatedAt),
  };
}

function serializeRepeatDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

export async function getAlarms(search?: string, userId?: string) {
  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (search) filter.title = { $regex: search, $options: "i" };

  const alarms = await Alarm.find(filter)
    .sort({ isEnabled: -1, time: 1 })
    .limit(LIST_LIMIT)
    .lean();

  return alarms.map(mapAlarm);
}

export async function getAlarmById(id: string, userId?: string) {
  const alarm = await Alarm.findById(id).lean();
  if (!alarm || (userId && alarm.userId.toString() !== userId)) return null;
  return mapAlarm(alarm);
}

export async function createAlarm(
  data: {
    title: string;
    time: string;
    repeatDays?: number[];
    isEnabled?: boolean;
    sound?: string;
  },
  userId: string
) {
  const alarm = await Alarm.create({
    userId,
    title: data.title,
    time: data.time,
    repeatDays: serializeRepeatDays(data.repeatDays ?? [0, 1, 2, 3, 4, 5, 6]),
    isEnabled: data.isEnabled ?? true,
    sound: data.sound ?? "default",
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
    sound?: string;
  },
  userId?: string
) {
  const existing = await Alarm.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) {
    throw new HttpError(404, "Alarm not found");
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.time !== undefined) updateData.time = data.time;
  if (data.repeatDays !== undefined) {
    updateData.repeatDays = serializeRepeatDays(data.repeatDays);
  }
  if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
  if (data.sound !== undefined) updateData.sound = data.sound;

  const alarm = await Alarm.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return mapAlarm(alarm);
}

export async function deleteAlarm(id: string, userId?: string) {
  const existing = await Alarm.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) {
    throw new HttpError(404, "Alarm not found");
  }
  await Alarm.findByIdAndDelete(id);
}

export async function toggleAlarmEnabled(id: string, userId?: string) {
  const current = await Alarm.findById(id);
  if (!current || (userId && current.userId.toString() !== userId)) return null;
  return updateAlarm(id, { isEnabled: !current.isEnabled }, userId);
}

export async function getTodayAlarms(userId?: string) {
  const day = new Date().getDay();
  const filter: Record<string, unknown> = { isEnabled: true };
  if (userId) filter.userId = userId;

  const alarms = await Alarm.find(filter).sort({ time: 1 }).lean();
  return alarms.map(mapAlarm).filter((a) => a.repeatDays.includes(day));
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
