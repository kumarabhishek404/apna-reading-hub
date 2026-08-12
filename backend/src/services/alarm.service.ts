import { Alarm } from "../models";
import type { AlarmItem } from "../lib/types";

function mapAlarm(a: any): AlarmItem {
  return {
    id: a._id.toString(),
    title: a.title,
    time: a.time,
    repeatDays: a.repeatDays.split(",").map((d: string) => parseInt(d.trim(), 10)).filter((n: number) => !Number.isNaN(n)),
    isEnabled: a.isEnabled,
    sound: (a.sound || "default") as AlarmItem["sound"],
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function serializeRepeatDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

export async function getAlarms(search?: string, userId?: string) {
  const filter: any = {};
  
  if (userId) {
    filter.userId = userId;
  }
  
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const alarms = await Alarm.find(filter)
    .sort({ isEnabled: "desc", time: "asc" });
  
  return alarms.map(mapAlarm);
}

export async function getAlarmById(id: string, userId?: string) {
  const alarm = await Alarm.findById(id);
  if (!alarm || (userId && alarm.userId.toString() !== userId)) return null;
  return mapAlarm(alarm);
}

export async function createAlarm(data: {
  title: string;
  time: string;
  repeatDays?: number[];
  isEnabled?: boolean;
  sound?: string;
}, userId: string) {
  console.log('[Alarm Service] Creating alarm', { userId, data });
  const alarm = await Alarm.create({
    userId,
    title: data.title,
    time: data.time,
    repeatDays: serializeRepeatDays(data.repeatDays ?? [0, 1, 2, 3, 4, 5, 6]),
    isEnabled: data.isEnabled ?? true,
    sound: data.sound ?? "default",
  });
  console.log('[Alarm Service] Alarm created in MongoDB', { alarmId: alarm._id?.toString() });
  const mappedAlarm = mapAlarm(alarm);
  console.log('[Alarm Service] Alarm mapped successfully', { mappedAlarm });
  return mappedAlarm;
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
  if (!existing || (userId && existing.userId.toString() !== userId)) throw new Error("Alarm not found");

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.time !== undefined) updateData.time = data.time;
  if (data.repeatDays !== undefined) updateData.repeatDays = serializeRepeatDays(data.repeatDays);
  if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
  if (data.sound !== undefined) updateData.sound = data.sound;

  const alarm = await Alarm.findByIdAndUpdate(id, updateData, { new: true });
  return mapAlarm(alarm);
}

export async function deleteAlarm(id: string, userId?: string) {
  const existing = await Alarm.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) throw new Error("Alarm not found");
  await Alarm.findByIdAndDelete(id);
}

export async function toggleAlarmEnabled(id: string, userId?: string) {
  const current = await Alarm.findById(id);
  if (!current || (userId && current.userId.toString() !== userId)) return null;
  return updateAlarm(id, { isEnabled: !current.isEnabled }, userId);
}

export async function getTodayAlarms(userId?: string) {
  const day = new Date().getDay();
  const alarms = await Alarm.find({ 
    userId: userId ?? undefined, 
    isEnabled: true 
  }).sort({ time: "asc" });
  
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
