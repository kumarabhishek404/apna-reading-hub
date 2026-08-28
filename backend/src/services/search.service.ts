import { Blog, Link, Pdf, Note, Reminder, Alarm } from "../models";
import type { DashboardStats, RecentItem, SearchResult } from "../lib/types";
import { mapTags, toIso } from "../lib/query";
import { noteContainsMongoClause, noteTextMongoClause } from "../lib/noteContains";
import { escapeRegex, parseSearchQuery } from "../lib/searchQuery";
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

  const recentSelect = { title: 1, tags: 1, createdAt: 1 };
  const [blogs, links, pdfs, notes, upcomingReminders, todayAlarms, favorites] = await Promise.all([
    Blog.find(userFilter).select(recentSelect).sort({ createdAt: -1 }).limit(5).lean(),
    Link.find(userFilter).select(recentSelect).sort({ createdAt: -1 }).limit(5).lean(),
    Pdf.find(userFilter).select(recentSelect).sort({ createdAt: -1 }).limit(5).lean(),
    Note.find(userFilter).select(recentSelect).sort({ createdAt: -1 }).limit(5).lean(),
    getUpcomingReminders(5, userId),
    getUpcomingAlarms(5, userId),
    getFavorites(userId),
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

  return { stats, recent, favorites, upcomingReminders, todayAlarms };
}

export async function getFavorites(userId?: string) {
  const userFilter = userId ? { userId } : {};

  const favoriteSelect = { title: 1, tags: 1, createdAt: 1, updatedAt: 1 };
  const [blogs, links, pdfs, notes] = await Promise.all([
    Blog.find({ ...userFilter, isFavorite: true }).select(favoriteSelect).sort({ updatedAt: -1 }).limit(50).lean(),
    Link.find({ ...userFilter, isFavorite: true }).select(favoriteSelect).sort({ updatedAt: -1 }).limit(50).lean(),
    Pdf.find({ ...userFilter, isFavorite: true }).select(favoriteSelect).sort({ updatedAt: -1 }).limit(50).lean(),
    Note.find({ ...userFilter, isFavorite: true }).select(favoriteSelect).sort({ updatedAt: -1 }).limit(50).lean(),
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

function asNoteResult(options: {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  tags: SearchResult["tags"];
  createdAt: string;
}): SearchResult {
  return {
    id: options.id,
    type: "note",
    title: options.title,
    subtitle: options.subtitle,
    url: options.href,
    tags: options.tags,
    createdAt: options.createdAt,
  };
}

function noteSubtitle(note: { title?: string; content?: string; blocks?: Array<{ type: string; content?: string | null; url?: string | null }> }) {
  const blocks = note.blocks ?? [];
  const pdf = blocks.find((block) => block.type === "pdf");
  if (pdf) return pdf.content || "PDF in this note";
  const linkPattern = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|org|net|io|in)\b)/i;
  const link = blocks.find(
    (block) =>
      block.type === "url" ||
      linkPattern.test(block.url || "") ||
      linkPattern.test(block.content || "")
  );
  if (link) return link.url || link.content || undefined;
  if (linkPattern.test(note.title || "") || linkPattern.test(note.content || "")) {
    return note.content || note.title;
  }
  return (note.content || "").slice(0, 80) || undefined;
}

export async function globalSearch(query: string, userId?: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const parsed = parseSearchQuery(query);
  const userFilter = userId ? { userId } : {};
  const textRegex = parsed.text ? { $regex: escapeRegex(parsed.text), $options: "i" } : null;
  const typeOnly = !parsed.text;
  const limit = typeOnly ? 50 : 20;

  if (parsed.schedule === "alarm") {
    const alarms = await Alarm.find({
      ...userFilter,
      ...(textRegex ? { title: textRegex } : {}),
    })
      .limit(limit)
      .sort({ time: 1 })
      .lean();
    return alarms.map((a) => ({
      id: a._id.toString(),
      type: "alarm" as const,
      title: a.title,
      subtitle: a.time,
      url: `/alarms`,
      tags: [],
      createdAt: toIso(a.createdAt),
    }));
  }

  if (parsed.schedule === "reminder") {
    const reminders = await Reminder.find({
      ...userFilter,
      ...(textRegex ? { $or: [{ title: textRegex }, { description: textRegex }] } : {}),
    })
      .limit(limit)
      .sort({ dueAt: 1 })
      .lean();
    return reminders.map((r) => ({
      id: r._id.toString(),
      type: "reminder" as const,
      title: r.title,
      subtitle: r.description || undefined,
      url: `/reminders`,
      tags: [],
      createdAt: toIso(r.dueAt),
    }));
  }

  const noteFilter: Record<string, unknown> = { ...userFilter };
  const noteClauses: Record<string, unknown>[] = [];
  const containsClause = noteContainsMongoClause(parsed.contains);
  if (containsClause) noteClauses.push(containsClause);
  if (textRegex) noteClauses.push(noteTextMongoClause(textRegex));
  if (noteClauses.length === 1) Object.assign(noteFilter, noteClauses[0]);
  else if (noteClauses.length > 1) noteFilter.$and = noteClauses;

  const askingForBlogs = /\b(blogs?|articles?)\b/i.test(query) && !parsed.contains && !parsed.schedule;
  const includeLegacyLinks = parsed.contains === "link" || (parsed.contains === null && !askingForBlogs && Boolean(parsed.text));
  const includeLegacyPdfs = parsed.contains === "pdf" || (parsed.contains === null && !askingForBlogs && Boolean(parsed.text));
  const includeLegacyBlogs = parsed.contains === null && (askingForBlogs || Boolean(parsed.text));
  const includeSchedule = parsed.contains === null && !askingForBlogs && Boolean(parsed.text);

  const [notes, links, pdfs, blogs, reminders, alarms] = await Promise.all([
    Note.find(noteFilter).limit(limit).sort({ createdAt: -1 }).lean(),
    includeLegacyLinks
      ? Link.find({
          ...userFilter,
          ...(textRegex ? { $or: [{ title: textRegex }, { description: textRegex }, { url: textRegex }] } : {}),
        })
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
      : Promise.resolve([]),
    includeLegacyPdfs
      ? Pdf.find({
          ...userFilter,
          ...(textRegex ? { $or: [{ title: textRegex }, { description: textRegex }] } : {}),
        })
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
      : Promise.resolve([]),
    includeLegacyBlogs
      ? Blog.find({
          ...userFilter,
          ...(textRegex ? { $or: [{ title: textRegex }, { content: textRegex }, { url: textRegex }] } : {}),
        })
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean()
      : Promise.resolve([]),
    includeSchedule && textRegex
      ? Reminder.find({
          ...userFilter,
          $or: [{ title: textRegex }, { description: textRegex }],
        })
          .limit(10)
          .sort({ dueAt: 1 })
          .lean()
      : Promise.resolve([]),
    includeSchedule && textRegex
      ? Alarm.find({
          ...userFilter,
          title: textRegex,
        })
          .limit(10)
          .sort({ time: 1 })
          .lean()
      : Promise.resolve([]),
  ]);

  const results: SearchResult[] = [
    ...notes.map((n) =>
      asNoteResult({
        id: n._id.toString(),
        title: n.title,
        subtitle: noteSubtitle(n),
        href: `/notes/${n._id}/edit`,
        tags: mapTags(n.tags),
        createdAt: toIso(n.createdAt),
      })
    ),
    ...links.map((l) =>
      asNoteResult({
        id: l._id.toString(),
        title: l.title,
        subtitle: l.url,
        href: `/links/${l._id}`,
        tags: mapTags(l.tags),
        createdAt: toIso(l.createdAt),
      })
    ),
    ...pdfs.map((p) =>
      asNoteResult({
        id: p._id.toString(),
        title: p.title,
        subtitle: p.description || "PDF in this note",
        href: `/pdfs/${p._id}`,
        tags: mapTags(p.tags),
        createdAt: toIso(p.createdAt),
      })
    ),
    ...blogs.map((b) =>
      asNoteResult({
        id: b._id.toString(),
        title: b.title,
        subtitle: b.url ?? ((b.content || "").slice(0, 80) || undefined),
        href: `/blogs/${b._id}/read`,
        tags: mapTags(b.tags),
        createdAt: toIso(b.createdAt),
      })
    ),
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
