import { prisma } from "../lib/prisma";
import type { LinkItem } from "../lib/types";
import { upsertTags } from "./tag.service";

const linkInclude = {
  tags: { include: { tag: true } },
} as const;

function mapLink(link: {
  id: string;
  title: string;
  url: string;
  description: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: string; name: string } }[];
}): LinkItem {
  return {
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description,
    isFavorite: link.isFavorite,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
    tags: link.tags.map((t) => t.tag),
  };
}

export async function getLinks(search?: string, tag?: string, userId?: string) {
  const links = await prisma.link.findMany({
    where: {
      userId: userId ?? undefined,
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { url: { contains: search } },
              ],
            }
          : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
      ],
    },
    include: linkInclude,
    orderBy: { createdAt: "desc" },
  });
  return links.map(mapLink);
}

export async function getLinkById(id: string, userId?: string) {
  const link = await prisma.link.findUnique({
    where: { id },
    include: linkInclude,
  });
  if (!link || (userId && link.userId !== userId)) return null;
  return mapLink(link);
}

export async function createLink(data: {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
}, userId: string) {
  const tags = await upsertTags(data.tags ?? []);
  const link = await prisma.link.create({
    data: {
      userId,
      title: data.title,
      url: data.url,
      description: data.description ?? "",
      isFavorite: data.isFavorite ?? false,
      tags: {
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
    },
    include: linkInclude,
  });
  return mapLink(link);
}

export async function updateLink(
  id: string,
  data: {
    title?: string;
    url?: string;
    description?: string;
    tags?: string[];
    isFavorite?: boolean;
  },
  userId?: string
) {
  const existing = await prisma.link.findUnique({ where: { id } });
  if (!existing || (userId && existing.userId !== userId)) throw new Error("Link not found");

  if (data.tags) {
    const tags = await upsertTags(data.tags);
    await prisma.linkTag.deleteMany({ where: { linkId: id } });
    await prisma.linkTag.createMany({
      data: tags.map((tag) => ({ linkId: id, tagId: tag.id })),
    });
  }

  const link = await prisma.link.update({
    where: { id },
    data: {
      title: data.title,
      url: data.url,
      description: data.description,
      isFavorite: data.isFavorite,
    },
    include: linkInclude,
  });
  return mapLink(link);
}

export async function deleteLink(id: string, userId?: string) {
  const existing = await prisma.link.findUnique({ where: { id } });
  if (!existing || (userId && existing.userId !== userId)) throw new Error("Link not found");
  await prisma.link.delete({ where: { id } });
}

export async function toggleLinkFavorite(id: string, userId?: string) {
  const current = await prisma.link.findUnique({ where: { id } });
  if (!current || (userId && current.userId !== userId)) return null;
  return updateLink(id, { isFavorite: !current.isFavorite }, userId);
}
