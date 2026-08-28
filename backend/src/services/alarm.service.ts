import { Alarm } from "../models";
import type { AlarmItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import { LIST_LIMIT, ownedFilter, toIso } from "../lib/query";

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
    oneShotDate: a.oneShotDate || null,
    createdAt: toIso(a.createdAt),
    updatedAt: toIso(a.updatedAt),
  };
}

function serializeRepeatDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

function todayStamp(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function clockStamp(now = new Date()) {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function todayOccurrenceFilter(userId: string | undefined, extras: Record<string, unknown> = {}) {
  const now = new Date();
  const day = now.getDay();
  const today = todayStamp(now);
  const filter: Record<string, unknown> = {
    isEnabled: true,
    $or: [
      { oneShotDate: today },
      {
        $and: [
          { $or: [{ oneShotDate: null }, { oneShotDate: "" }, { oneShotDate: { $exists: false } }] },
          { repeatDays: { $regex: `(^|,)${day}(,|$)` } },
        ],
      },
    ],
    ...extras,
  };
  if (userId) filter.userId = userId;
  return filter;
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
  const alarm = await Alarm.findOne(ownedFilter(id, userId)).lean();
  if (!alarm) return null;
  return mapAlarm(alarm);
}

export async function createAlarm(
  data: {
    title: string;
    time: string;
    repeatDays?: number[];
    isEnabled?: boolean;
    sound?: string;
    oneShotDate?: string | null;
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
    oneShotDate: data.oneShotDate ?? null,
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
    oneShotDate?: string | null;
  },
  userId?: string
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.time !== undefined) updateData.time = data.time;
  if (data.repeatDays !== undefined) {
    updateData.repeatDays = serializeRepeatDays(data.repeatDays);
  }
  if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
  if (data.sound !== undefined) updateData.sound = data.sound;
  if (data.oneShotDate !== undefined) updateData.oneShotDate = data.oneShotDate;

  const alarm = await Alarm.findOneAndUpdate(ownedFilter(id, userId), updateData, {
    new: true,
  }).lean();
  if (!alarm) throw new HttpError(404, "Alarm not found");
  return mapAlarm(alarm);
}

export async function deleteAlarm(id: string, userId?: string) {
  const result = await Alarm.findOneAndDelete(ownedFilter(id, userId)).lean();
  if (!result) throw new HttpError(404, "Alarm not found");
}

export async function toggleAlarmEnabled(id: string, userId?: string) {
  const alarm = await Alarm.findOneAndUpdate(
    ownedFilter(id, userId),
    [{ $set: { isEnabled: { $eq: ["$isEnabled", false] } } }],
    { new: true }
  ).lean();
  if (!alarm) return null;
  return mapAlarm(alarm);
}

export async function getTodayAlarms(userId?: string) {
  const alarms = await Alarm.find(todayOccurrenceFilter(userId)).sort({ time: 1 }).lean();
  return alarms.map(mapAlarm);
}

export async function getUpcomingAlarms(limit = 10, userId?: string) {
  const now = new Date();
  const alarms = await Alarm.find(
    todayOccurrenceFilter(userId, { time: { $gte: clockStamp(now) } })
  )
    .sort({ time: 1 })
    .limit(limit)
    .lean();
  return alarms.map(mapAlarm);
}
