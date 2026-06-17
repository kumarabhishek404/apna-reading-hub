import { prisma } from "../lib/prisma";
import type { DashboardStats, RecentItem, SearchResult } from "../lib/types";

export async function getDashboardData() {
  const [totalBlogs, totalLinks, totalPdfs, totalNotes] = await Promise.all([
    prisma.blog.count(),
    prisma.link.count(),
    prisma.pdf.count(),
    prisma.note.count(),
  ]);

  const stats: DashboardStats = {
    totalBlogs,
    totalLinks,
    totalPdfs,
    totalNotes,
  };

  const [blogs, links, pdfs, notes] = await Promise.all([
    prisma.blog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.link.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.pdf.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.note.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
  ]);

  const recent: RecentItem[] = [
    ...blogs.map((b) => ({
      id: b.id,
      type: "blog" as const,
      title: b.title,
      createdAt: b.createdAt.toISOString(),
      tags: b.tags.map((t) => t.tag),
    })),
    ...links.map((l) => ({
      id: l.id,
      type: "link" as const,
      title: l.title,
      createdAt: l.createdAt.toISOString(),
      tags: l.tags.map((t) => t.tag),
    })),
    ...pdfs.map((p) => ({
      id: p.id,
      type: "pdf" as const,
      title: p.title,
      createdAt: p.createdAt.toISOString(),
      tags: p.tags.map((t) => t.tag),
    })),
    ...notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      createdAt: n.createdAt.toISOString(),
      tags: n.tags.map((t) => t.tag),
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  const favorites = await getFavorites();

  return { stats, recent, favorites };
}

export async function getFavorites() {
  const [blogs, links, pdfs, notes] = await Promise.all([
    prisma.blog.findMany({
      where: { isFavorite: true },
      orderBy: { updatedAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.link.findMany({
      where: { isFavorite: true },
      orderBy: { updatedAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.pdf.findMany({
      where: { isFavorite: true },
      orderBy: { updatedAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.note.findMany({
      where: { isFavorite: true },
      orderBy: { updatedAt: "desc" },
      include: { tags: { include: { tag: true } } },
    }),
  ]);

  return [
    ...blogs.map((b) => ({
      id: b.id,
      type: "blog" as const,
      title: b.title,
      createdAt: b.createdAt.toISOString(),
      tags: b.tags.map((t) => t.tag),
    })),
    ...links.map((l) => ({
      id: l.id,
      type: "link" as const,
      title: l.title,
      createdAt: l.createdAt.toISOString(),
      tags: l.tags.map((t) => t.tag),
    })),
    ...pdfs.map((p) => ({
      id: p.id,
      type: "pdf" as const,
      title: p.title,
      createdAt: p.createdAt.toISOString(),
      tags: p.tags.map((t) => t.tag),
    })),
    ...notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      createdAt: n.createdAt.toISOString(),
      tags: n.tags.map((t) => t.tag),
    })),
  ];
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const [blogs, links, pdfs, notes] = await Promise.all([
    prisma.blog.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { url: { contains: query } },
        ],
      },
      take: 10,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.link.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { url: { contains: query } },
        ],
      },
      take: 10,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pdf.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 10,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.note.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      take: 10,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results: SearchResult[] = [
    ...blogs.map((b) => ({
      id: b.id,
      type: "blog" as const,
      title: b.title,
      subtitle: b.url ?? undefined,
      url: `/blogs/${b.id}/read`,
      tags: b.tags.map((t) => t.tag),
      createdAt: b.createdAt.toISOString(),
    })),
    ...links.map((l) => ({
      id: l.id,
      type: "link" as const,
      title: l.title,
      subtitle: l.url,
      url: `/links/${l.id}`,
      tags: l.tags.map((t) => t.tag),
      createdAt: l.createdAt.toISOString(),
    })),
    ...pdfs.map((p) => ({
      id: p.id,
      type: "pdf" as const,
      title: p.title,
      subtitle: p.description || undefined,
      url: `/pdfs/${p.id}`,
      tags: p.tags.map((t) => t.tag),
      createdAt: p.createdAt.toISOString(),
    })),
    ...notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      subtitle: n.content.slice(0, 80) || undefined,
      url: `/notes/${n.id}/read`,
      tags: n.tags.map((t) => t.tag),
      createdAt: n.createdAt.toISOString(),
    })),
  ];

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
