import { Tag, Blog, Link, Pdf, Note } from "../models";
import { parseTags } from "../lib/utils";

export async function upsertTags(tagNames: string[]) {
  const names = parseTags(tagNames);
  const tags = await Promise.all(
    names.map(async (name) => {
      const tag = await Tag.findOneAndUpdate(
        { name },
        { name },
        { upsert: true, new: true }
      );
      return tag;
    })
  );
  return tags;
}

export async function getAllTagsWithCounts(userId?: string) {
  const tags = await Tag.find().sort({ name: "asc" });

  const filtered = userId
    ? await Promise.all(
        tags.map(async (tag) => {
          const [blogs, links, pdfs, notes] = await Promise.all([
            Blog.countDocuments({ tags: tag.name, userId }),
            Link.countDocuments({ tags: tag.name, userId }),
            Pdf.countDocuments({ tags: tag.name, userId }),
            Note.countDocuments({ tags: tag.name, userId }),
          ]);
          return { id: tag._id.toString(), name: tag.name, count: blogs + links + pdfs + notes };
        })
      )
    : await Promise.all(
        tags.map(async (tag) => {
          const [blogs, links, pdfs, notes] = await Promise.all([
            Blog.countDocuments({ tags: tag.name }),
            Link.countDocuments({ tags: tag.name }),
            Pdf.countDocuments({ tags: tag.name }),
            Note.countDocuments({ tags: tag.name }),
          ]);
          return { id: tag._id.toString(), name: tag.name, count: blogs + links + pdfs + notes };
        })
      );

  return filtered.filter((tag) => tag.count > 0);
}

export async function getTagByName(name: string) {
  return Tag.findOne({ name });
}
