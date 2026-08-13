import { Tag, Blog, Link, Pdf, Note } from "../models";
import { parseTags } from "../lib/utils";

export async function upsertTags(tagNames: string[]) {
  console.log('[Tag Service] Upserting tags', { tagNames });
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
  console.log('[Tag Service] Tags upserted', { count: tags.length });
  return tags;
}

export async function getAllTagsWithCounts(userId?: string) {
  console.log('[Tag Service] Getting all tags with counts', { userId });
  const tags = await Tag.find().sort({ name: "asc" });
  console.log('[Tag Service] Found tags', { count: tags.length });

  const filtered = userId
    ? await Promise.all(
        tags.map(async (tag) => {
          const [blogs, links, pdfs, notes] = await Promise.all([
            Blog.countDocuments({ tags: tag.name, userId }),
            Link.countDocuments({ tags: tag.name, userId }),
            Pdf.countDocuments({ tags: tag.name, userId }),
            Note.countDocuments({ tags: tag.name, userId }),
          ]);
          return { id: (tag as any)._id.toString(), name: tag.name, count: blogs + links + pdfs + notes };
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
          return { id: (tag as any)._id.toString(), name: tag.name, count: blogs + links + pdfs + notes };
        })
      );

  const result = filtered.filter((tag) => tag.count > 0);
  console.log('[Tag Service] Tags with counts', { total: result.length });
  return result;
}

export async function getTagByName(name: string) {
  console.log('[Tag Service] Getting tag by name', { name });
  return Tag.findOne({ name });
}

export async function createTag(name: string) {
  console.log('[Tag Service] Creating tag', { name });
  const tag = await Tag.create({ name });
  console.log('[Tag Service] Tag created', { id: (tag as any)._id.toString() });
  return tag;
}

export async function updateTag(id: string, name: string) {
  console.log('[Tag Service] Updating tag', { id, name });
  const tag = await Tag.findByIdAndUpdate(id, { name }, { new: true });
  console.log('[Tag Service] Tag updated', { found: !!tag });
  return tag;
}

export async function deleteTag(id: string) {
  console.log('[Tag Service] Deleting tag', { id });
  await Tag.findByIdAndDelete(id);
  console.log('[Tag Service] Tag deleted');
  return { success: true };
}

export async function getContentByTag(tagName: string, userId?: string) {
  console.log('[Tag Service] Getting content by tag', { tagName, userId });
  const [blogs, links, pdfs, notes] = await Promise.all([
    Blog.find(userId ? { tags: tagName, userId } : { tags: tagName }),
    Link.find(userId ? { tags: tagName, userId } : { tags: tagName }),
    Pdf.find(userId ? { tags: tagName, userId } : { tags: tagName }),
    Note.find(userId ? { tags: tagName, userId } : { tags: tagName }),
  ]);

  const result = {
    blogs,
    links,
    pdfs,
    notes,
    total: blogs.length + links.length + pdfs.length + notes.length,
  };
  
  console.log('[Tag Service] Content by tag', {
    blogs: blogs.length,
    links: links.length,
    pdfs: pdfs.length,
    notes: notes.length,
    total: result.total,
  });
  
  return result;
}
