import { prisma } from "../lib/prisma";
import { parseTags } from "../lib/utils";

export async function upsertTags(tagNames: string[]) {
  const names = parseTags(tagNames);
  const tags = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    )
  );
  return tags;
}

export async function getAllTagsWithCounts() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          blogs: true,
          links: true,
          pdfs: true,
          notes: true,
        },
      },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    count:
      tag._count.blogs +
      tag._count.links +
      tag._count.pdfs +
      tag._count.notes,
  }));
}

export async function getTagByName(name: string) {
  return prisma.tag.findUnique({ where: { name } });
}
