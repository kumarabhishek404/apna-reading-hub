import { Tag, Blog, Link, Pdf, Note } from "../models";
import { parseTags } from "../lib/utils";
import { HttpError } from "../lib/errors";
import mongoose from "mongoose";

function mapDoc(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    url: doc.url,
    description: doc.description,
    pdfUrl: doc.pdfUrl,
    isFavorite: doc.isFavorite,
    isPinned: doc.isPinned,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
    tags: (doc.tags || []).map((name: string) => ({ id: name, name })),
  };
}

export async function upsertTags(tagNames: string[]) {
  const names = parseTags(tagNames);
  if (names.length === 0) return [];

  await Tag.bulkWrite(
    names.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name } },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  return Tag.find({ name: { $in: names } }).lean();
}

/**
 * Efficient tag counts for the current user (avoids N+1 count queries).
 */
export async function getAllTagsWithCounts(userId?: string) {
  const matchUser = userId
    ? { userId: new mongoose.Types.ObjectId(userId) }
    : {};

  const [blogAgg, linkAgg, pdfAgg, noteAgg] = await Promise.all([
    Blog.aggregate([{ $match: matchUser }, { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }]),
    Link.aggregate([{ $match: matchUser }, { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }]),
    Pdf.aggregate([{ $match: matchUser }, { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }]),
    Note.aggregate([{ $match: matchUser }, { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }]),
  ]);

  const counts = new Map<string, number>();
  for (const row of [...blogAgg, ...linkAgg, ...pdfAgg, ...noteAgg]) {
    const name = String(row._id);
    counts.set(name, (counts.get(name) || 0) + row.count);
  }

  if (counts.size === 0) return [];

  const tags = await Tag.find({ name: { $in: [...counts.keys()] } })
    .sort({ name: "asc" })
    .lean();

  const known = new Set(tags.map((t) => t.name));
  const result = tags.map((tag) => ({
    id: tag._id.toString(),
    name: tag.name,
    count: counts.get(tag.name) || 0,
  }));

  // Include tag names present on content but missing from Tag collection.
  for (const [name, count] of counts) {
    if (!known.has(name) && count > 0) {
      result.push({ id: name, name, count });
    }
  }

  return result
    .filter((tag) => tag.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTagByName(name: string) {
  return Tag.findOne({ name }).lean();
}

export async function createTag(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new HttpError(400, "Tag name is required");

  try {
    const tag = await Tag.create({ name: trimmed });
    return {
      id: tag._id.toString(),
      name: tag.name,
      count: 0,
    };
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new HttpError(409, "Tag already exists");
    }
    throw error;
  }
}

export async function updateTag(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new HttpError(400, "Tag name is required");

  const tag = await Tag.findByIdAndUpdate(id, { name: trimmed }, { new: true });
  if (!tag) throw new HttpError(404, "Tag not found");
  return {
    id: tag._id.toString(),
    name: tag.name,
    count: 0,
  };
}

export async function deleteTag(id: string) {
  const tag = await Tag.findByIdAndDelete(id);
  if (!tag) throw new HttpError(404, "Tag not found");
  return { success: true };
}

/**
 * Returns a unified `items` list expected by the mobile client,
 * plus legacy keys for compatibility.
 */
export async function getContentByTag(tagName: string, userId?: string) {
  const filter = userId ? { tags: tagName, userId } : { tags: tagName };

  const [blogs, links, pdfs, notes] = await Promise.all([
    Blog.find(filter).sort({ createdAt: -1 }).lean(),
    Link.find(filter).sort({ createdAt: -1 }).lean(),
    Pdf.find(filter).sort({ createdAt: -1 }).lean(),
    Note.find(filter).sort({ createdAt: -1 }).lean(),
  ]);

  // Flat shape `{ kind, ...fields }` — matches mobile Tag Content screen.
  const items = [
    ...blogs.map((doc) => ({ kind: "blog" as const, ...mapDoc(doc) })),
    ...links.map((doc) => ({ kind: "link" as const, ...mapDoc(doc) })),
    ...pdfs.map((doc) => ({ kind: "pdf" as const, ...mapDoc(doc) })),
    ...notes.map((doc) => ({ kind: "note" as const, ...mapDoc(doc) })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    items,
    blogs: items.filter((i) => i.kind === "blog"),
    links: items.filter((i) => i.kind === "link"),
    pdfs: items.filter((i) => i.kind === "pdf"),
    notes: items.filter((i) => i.kind === "note"),
    total: items.length,
  };
}
