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

export async function getAllTagsWithCounts(userId?: string) {
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

  const filtered = userId
    ? await Promise.all(
        tags.map(async (tag) => {
          const [blogs, links, pdfs, notes] = await Promise.all([
            prisma.blogTag.count({ where: { tagId: tag.id, blog: { userId } } }),
            prisma.linkTag.count({ where: { tagId: tag.id, link: { userId } } }),
            prisma.pdfTag.count({ where: { tagId: tag.id, pdf: { userId } } }),
            prisma.noteTag.count({ where: { tagId: tag.id, note: { userId } } }),
          ]);
          return { id: tag.id, name: tag.name, count: blogs + links + pdfs + notes };
        })
      )
    : tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count:
          tag._count.blogs +
          tag._count.links +
          tag._count.pdfs +
          tag._count.notes,
      }));

  return filtered.filter((tag) => tag.count > 0);
}

export async function getTagByName(name: string) {
  return prisma.tag.findUnique({ where: { name } });
}
