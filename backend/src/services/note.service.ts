import { Note } from "../models";
import type { NoteItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import {
  LIST_BLOCK_CHARS,
  LIST_CONTENT_CHARS,
  LIST_LIMIT,
  clipText,
  mapTags,
  ownedFilter,
  toIso,
} from "../lib/query";
import { noteContainsMongoClause, noteTextMongoClause } from "../lib/noteContains";
import { escapeRegex, parseContainsParam, parseSearchQuery } from "../lib/searchQuery";
import { upsertTags } from "./tag.service";

type NoteBlock = {
  type: "text" | "image" | "pdf" | "url" | "checklist" | "handwriting" | "video";
  content?: string | null;
  url?: string | null;
  checked?: boolean;
  order: number;
  format?: "body" | "heading" | "subheading" | "bold" | "italic";
  color?: string;
};

function mapBlocks(blocks: NoteBlock[] | undefined, clip = false): NoteItem["blocks"] {
  return (blocks || []).map((block) => ({
    ...block,
    content: clip ? clipText(block.content, LIST_BLOCK_CHARS) : block.content,
    url:
      clip &&
      typeof block.url === "string" &&
      block.url.startsWith("data:") &&
      block.type !== "image" &&
      block.type !== "handwriting"
        ? null
        : block.url,
  }));
}

function mapNote(note: any, options?: { list?: boolean }): NoteItem {
  const list = options?.list === true;
  return {
    id: note._id.toString(),
    title: note.title,
    content: list ? clipText(note.content, LIST_CONTENT_CHARS) : note.content,
    isPinned: note.isPinned,
    isFavorite: note.isFavorite,
    createdAt: toIso(note.createdAt),
    updatedAt: toIso(note.updatedAt),
    tags: mapTags(note.tags),
    blocks: mapBlocks(note.blocks, list),
  };
}

export async function getNotes(
  search?: string,
  tag?: string,
  userId?: string,
  contains?: string
) {
  const explicitContains = parseContainsParam(contains);
  const parsed = parseSearchQuery(search ?? "");
  const containsKind = explicitContains ?? parsed.contains;
  const text = explicitContains ? (search ?? "").trim() : parsed.text;

  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (tag) filter.tags = tag;

  const clauses: Record<string, unknown>[] = [];
  const containsClause = noteContainsMongoClause(containsKind);
  if (containsClause) clauses.push(containsClause);
  if (text) {
    clauses.push(noteTextMongoClause({ $regex: escapeRegex(text), $options: "i" }));
  }
  if (clauses.length === 1) {
    Object.assign(filter, clauses[0]);
  } else if (clauses.length > 1) {
    filter.$and = clauses;
  }

  const notes = await Note.find(filter)
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(LIST_LIMIT)
    .lean();

  return notes.map((note) => mapNote(note, { list: true }));
}

export async function getNoteById(id: string, userId?: string) {
  const note = await Note.findOne(ownedFilter(id, userId)).lean();
  if (!note) return null;
  return mapNote(note);
}

export async function createNote(
  data: {
    title: string;
    content?: string;
    tags?: string[];
    isPinned?: boolean;
    isFavorite?: boolean;
    blocks?: NoteBlock[];
  },
  userId: string
) {
  const tags = await upsertTags(data.tags ?? []);
  const note = await Note.create({
    userId,
    title: data.title,
    content: data.content ?? "",
    isPinned: data.isPinned ?? false,
    isFavorite: data.isFavorite ?? false,
    tags: tags.map((tag) => tag.name),
    blocks: data.blocks || [],
  });
  return mapNote(note);
}

export async function updateNote(
  id: string,
  data: {
    title?: string;
    content?: string;
    tags?: string[];
    isPinned?: boolean;
    isFavorite?: boolean;
    blocks?: NoteBlock[];
  },
  userId?: string
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.tags !== undefined) {
    const tags = await upsertTags(data.tags);
    updateData.tags = tags.map((tag) => tag.name);
  }
  if (data.blocks !== undefined) updateData.blocks = data.blocks;

  const note = await Note.findOneAndUpdate(ownedFilter(id, userId), updateData, {
    new: true,
  }).lean();
  if (!note) throw new HttpError(404, "Note not found");
  return mapNote(note);
}

export async function deleteNote(id: string, userId?: string) {
  const result = await Note.findOneAndDelete(ownedFilter(id, userId)).lean();
  if (!result) throw new HttpError(404, "Note not found");
}

export async function toggleNoteFavorite(id: string, userId?: string) {
  const note = await Note.findOneAndUpdate(
    ownedFilter(id, userId),
    [{ $set: { isFavorite: { $eq: ["$isFavorite", false] } } }],
    { new: true }
  ).lean();
  if (!note) return null;
  return mapNote(note);
}

export async function toggleNotePin(id: string, userId?: string) {
  const note = await Note.findOneAndUpdate(
    ownedFilter(id, userId),
    [{ $set: { isPinned: { $eq: ["$isPinned", false] } } }],
    { new: true }
  ).lean();
  if (!note) return null;
  return mapNote(note);
}

export function exportNoteAsMarkdown(note: NoteItem) {
  const tagLine =
    note.tags.length > 0
      ? `\n\n---\n\nTags: ${note.tags.map((t) => t.name).join(", ")}`
      : "";
  return `# ${note.title}\n\n${note.content}${tagLine}`;
}
