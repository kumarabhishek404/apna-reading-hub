import { Blog, Link, Pdf, Note, Reminder, Alarm } from "../models";
import type { DashboardStats, RecentItem, SearchResult } from "../lib/types";
import { mapTags, toIso } from "../lib/query";
import { getUpcomingAlarms } from "./alarm.service";
import { getUpcomingReminders } from "./reminder.service";

export async function getDashboardData(userId?: string) {
  const userFilter = userId ? { userId } : {};

  const [totalBlogs, totalLinks, totalPdfs, totalNotes, totalReminders, totalAlarms] =
    await Promise.all([
      Blog.countDocuments(userFilter),
      Link.countDocuments(userFilter),
      Pdf.countDocuments(userFilter),
      Note.countDocuments(userFilter),
      Reminder.countDocuments({ ...userFilter, isCompleted: false }),
      Alarm.countDocuments({ ...userFilter, isEnabled: true }),
    ]);

  const stats: DashboardStats = {
    totalBlogs,
    totalLinks,
    totalPdfs,
    totalNotes,
    totalReminders,
    totalAlarms,
  };

  const [blogs, links, pdfs, notes, upcomingReminders, todayAlarms] = await Promise.all([
    Blog.find(userFilter).sort({ createdAt: -1 }).limit(5).lean(),
    Link.find(userFilter).sort({ createdAt: -1 }).limit(5).lean(),
    Pdf.find(userFilter).sort({ createdAt: -1 }).limit(5).lean(),
    Note.find(userFilter).sort({ createdAt: -1 }).limit(5).lean(),
    getUpcomingReminders(5, userId),
    getUpcomingAlarms(5, userId),
  ]);

  const recent: RecentItem[] = [
    ...blogs.map((b) => ({
      id: b._id.toString(),
      type: "blog" as const,
      title: b.title,
      createdAt: toIso(b.createdAt),
      tags: mapTags(b.tags),
    })),
    ...links.map((l) => ({
      id: l._id.toString(),
      type: "link" as const,
      title: l.title,
      createdAt: toIso(l.createdAt),
      tags: mapTags(l.tags),
    })),
    ...pdfs.map((p) => ({
      id: p._id.toString(),
      type: "pdf" as const,
      title: p.title,
      createdAt: toIso(p.createdAt),
      tags: mapTags(p.tags),
    })),
    ...notes.map((n) => ({
      id: n._id.toString(),
      type: "note" as const,
      title: n.title,
      createdAt: toIso(n.createdAt),
      tags: mapTags(n.tags),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const favorites = await getFavorites(userId);

  return { stats, recent, favorites, upcomingReminders, todayAlarms };
}

export async function getFavorites(userId?: string) {
  const userFilter = userId ? { userId } : {};

  const [blogs, links, pdfs, notes] = await Promise.all([
    Blog.find({ ...userFilter, isFavorite: true }).sort({ updatedAt: -1 }).limit(50).lean(),
    Link.find({ ...userFilter, isFavorite: true }).sort({ updatedAt: -1 }).limit(50).lean(),
    Pdf.find({ ...userFilter, isFavorite: true }).sort({ updatedAt: -1 }).limit(50).lean(),
    Note.find({ ...userFilter, isFavorite: true }).sort({ updatedAt: -1 }).limit(50).lean(),
  ]);

  return [
    ...blogs.map((b) => ({
      id: b._id.toString(),
      type: "blog" as const,
      title: b.title,
      createdAt: toIso(b.createdAt),
      tags: mapTags(b.tags),
    })),
    ...links.map((l) => ({
      id: l._id.toString(),
      type: "link" as const,
      title: l.title,
      createdAt: toIso(l.createdAt),
      tags: mapTags(l.tags),
    })),
    ...pdfs.map((p) => ({
      id: p._id.toString(),
      type: "pdf" as const,
      title: p.title,
      createdAt: toIso(p.createdAt),
      tags: mapTags(p.tags),
    })),
    ...notes.map((n) => ({
      id: n._id.toString(),
      type: "note" as const,
      title: n.title,
      createdAt: toIso(n.createdAt),
      tags: mapTags(n.tags),
    })),
  ];
}

export async function globalSearch(query: string, userId?: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const userFilter = userId ? { userId } : {};
  const searchRegex = { $regex: query, $options: "i" };

  const [blogs, links, pdfs, notes, reminders, alarms] = await Promise.all([
    Blog.find({
      ...userFilter,
      $or: [{ title: searchRegex }, { content: searchRegex }, { url: searchRegex }],
    })
      .limit(10)
      .sort({ createdAt: -1 })
      .lean(),
    Link.find({
      ...userFilter,
      $or: [{ title: searchRegex }, { description: searchRegex }, { url: searchRegex }],
    })
      .limit(10)
      .sort({ createdAt: -1 })
      .lean(),
    Pdf.find({
      ...userFilter,
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .limit(10)
      .sort({ createdAt: -1 })
      .lean(),
    Note.find({
      ...userFilter,
      $or: [{ title: searchRegex }, { content: searchRegex }],
    })
      .limit(10)
      .sort({ createdAt: -1 })
      .lean(),
    Reminder.find({
      ...userFilter,
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .limit(10)
      .sort({ dueAt: 1 })
      .lean(),
    Alarm.find({
      ...userFilter,
      title: searchRegex,
    })
      .limit(10)
      .sort({ time: 1 })
      .lean(),
  ]);

  const results: SearchResult[] = [
    ...blogs.map((b) => ({
      id: b._id.toString(),
      type: "blog" as const,
      title: b.title,
      subtitle: b.url ?? undefined,
      url: `/blogs/${b._id}/read`,
      tags: mapTags(b.tags),
      createdAt: toIso(b.createdAt),
    })),
    ...links.map((l) => ({
      id: l._id.toString(),
      type: "link" as const,
      title: l.title,
      subtitle: l.url,
      url: `/links/${l._id}`,
      tags: mapTags(l.tags),
      createdAt: toIso(l.createdAt),
    })),
    ...pdfs.map((p) => ({
      id: p._id.toString(),
      type: "pdf" as const,
      title: p.title,
      subtitle: p.description || undefined,
      url: `/pdfs/${p._id}`,
      tags: mapTags(p.tags),
      createdAt: toIso(p.createdAt),
    })),
    ...notes.map((n) => ({
      id: n._id.toString(),
      type: "note" as const,
      title: n.title,
      subtitle: (n.content || "").slice(0, 80) || undefined,
      url: `/notes/${n._id}/read`,
      tags: mapTags(n.tags),
      createdAt: toIso(n.createdAt),
    })),
    ...reminders.map((r) => ({
      id: r._id.toString(),
      type: "reminder" as const,
      title: r.title,
      subtitle: r.description || undefined,
      url: `/reminders`,
      tags: [],
      createdAt: toIso(r.dueAt),
    })),
    ...alarms.map((a) => ({
      id: a._id.toString(),
      type: "alarm" as const,
      title: a.title,
      subtitle: a.time,
      url: `/alarms`,
      tags: [],
      createdAt: toIso(a.createdAt),
    })),
  ];

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
