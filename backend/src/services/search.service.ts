import { Blog, Link, Pdf, Note, Reminder, Alarm } from "../models";
import type { DashboardStats, RecentItem, SearchResult } from "../lib/types";
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
    Blog.find(userFilter)
      .sort({ createdAt: "desc" })
      .limit(5),
    Link.find(userFilter)
      .sort({ createdAt: "desc" })
      .limit(5),
    Pdf.find(userFilter)
      .sort({ createdAt: "desc" })
      .limit(5),
    Note.find(userFilter)
      .sort({ createdAt: "desc" })
      .limit(5),
    getUpcomingReminders(5, userId),
    getUpcomingAlarms(5, userId),
  ]);

  const recent: RecentItem[] = [
    ...blogs.map((b) => ({
      id: b._id.toString(),
      type: "blog" as const,
      title: b.title,
      createdAt: b.createdAt.toISOString(),
      tags: b.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
    })),
    ...links.map((l) => ({
      id: l._id.toString(),
      type: "link" as const,
      title: l.title,
      createdAt: l.createdAt.toISOString(),
      tags: l.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
    })),
    ...pdfs.map((p) => ({
      id: p._id.toString(),
      type: "pdf" as const,
      title: p.title,
      createdAt: p.createdAt.toISOString(),
      tags: p.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
    })),
    ...notes.map((n) => ({
      id: n._id.toString(),
      type: "note" as const,
      title: n.title,
      createdAt: n.createdAt.toISOString(),
      tags: n.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const favorites = await getFavorites(userId);

  return { stats, recent, favorites, upcomingReminders, todayAlarms };
}

export async function getFavorites(userId?: string) {
  const userFilter = userId ? { userId } : {};
  
  const [blogs, links, pdfs, notes] = await Promise.all([
    Blog.find({ ...userFilter, isFavorite: true })
      .sort({ updatedAt: "desc" }),
    Link.find({ ...userFilter, isFavorite: true })
      .sort({ updatedAt: "desc" }),
    Pdf.find({ ...userFilter, isFavorite: true })
      .sort({ updatedAt: "desc" }),
    Note.find({ ...userFilter, isFavorite: true })
      .sort({ updatedAt: "desc" }),
  ]);

  return [
    ...blogs.map((b) => ({
      id: b._id.toString(),
      type: "blog" as const,
      title: b.title,
      createdAt: b.createdAt.toISOString(),
      tags: b.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
    })),
    ...links.map((l) => ({
      id: l._id.toString(),
      type: "link" as const,
      title: l.title,
      createdAt: l.createdAt.toISOString(),
      tags: l.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
    })),
    ...pdfs.map((p) => ({
      id: p._id.toString(),
      type: "pdf" as const,
      title: p.title,
      createdAt: p.createdAt.toISOString(),
      tags: p.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
    })),
    ...notes.map((n) => ({
      id: n._id.toString(),
      type: "note" as const,
      title: n.title,
      createdAt: n.createdAt.toISOString(),
      tags: n.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
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
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { url: searchRegex },
      ],
    })
      .limit(10)
      .sort({ createdAt: "desc" }),
    Link.find({
      ...userFilter,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { url: searchRegex },
      ],
    })
      .limit(10)
      .sort({ createdAt: "desc" }),
    Pdf.find({
      ...userFilter,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
      ],
    })
      .limit(10)
      .sort({ createdAt: "desc" }),
    Note.find({
      ...userFilter,
      $or: [
        { title: searchRegex },
        { content: searchRegex },
      ],
    })
      .limit(10)
      .sort({ createdAt: "desc" }),
    Reminder.find({
      ...userFilter,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
      ],
    })
      .limit(10)
      .sort({ dueAt: "asc" }),
    Alarm.find({
      ...userFilter,
      title: searchRegex,
    })
      .limit(10)
      .sort({ time: "asc" }),
  ]);

  const results: SearchResult[] = [
    ...blogs.map((b) => ({
      id: b._id.toString(),
      type: "blog" as const,
      title: b.title,
      subtitle: b.url ?? undefined,
      url: `/blogs/${b._id}/read`,
      tags: b.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
      createdAt: b.createdAt.toISOString(),
    })),
    ...links.map((l) => ({
      id: l._id.toString(),
      type: "link" as const,
      title: l.title,
      subtitle: l.url,
      url: `/links/${l._id}`,
      tags: l.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
      createdAt: l.createdAt.toISOString(),
    })),
    ...pdfs.map((p) => ({
      id: p._id.toString(),
      type: "pdf" as const,
      title: p.title,
      subtitle: p.description || undefined,
      url: `/pdfs/${p._id}`,
      tags: p.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
      createdAt: p.createdAt.toISOString(),
    })),
    ...notes.map((n) => ({
      id: n._id.toString(),
      type: "note" as const,
      title: n.title,
      subtitle: n.content.slice(0, 80) || undefined,
      url: `/notes/${n._id}/read`,
      tags: n.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
      createdAt: n.createdAt.toISOString(),
    })),
    ...reminders.map((r) => ({
      id: r._id.toString(),
      type: "reminder" as const,
      title: r.title,
      subtitle: r.description || undefined,
      url: `/reminders`,
      tags: [],
      createdAt: r.dueAt.toISOString(),
    })),
    ...alarms.map((a) => ({
      id: a._id.toString(),
      type: "alarm" as const,
      title: a.title,
      subtitle: a.time,
      url: `/alarms`,
      tags: [],
      createdAt: a.createdAt.toISOString(),
    })),
  ];

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
