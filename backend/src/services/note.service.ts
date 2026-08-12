import { Note, Tag } from "../models";
import type { NoteItem } from "../lib/types";
import { upsertTags } from "./tag.service";

function mapNote(note: any): NoteItem {
  return {
    id: note._id.toString(),
    title: note.title,
    content: note.content,
    isPinned: note.isPinned,
    isFavorite: note.isFavorite,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
  };
}

export async function getNotes(search?: string, tag?: string, userId?: string) {
  const filter: any = {};
  
  if (userId) {
    filter.userId = userId;
  }
  
  if (tag) {
    filter.tags = tag;
  }
  
  if (search) {
    filter.$text = { $search: search };
  }

  const notes = await Note.find(filter)
    .sort({ isPinned: "desc", createdAt: "desc" });
  
  return notes.map(mapNote);
}

export async function getNoteById(id: string, userId?: string) {
  const note = await Note.findById(id);
  if (!note || (userId && note.userId.toString() !== userId)) return null;
  return mapNote(note);
}

export async function createNote(data: {
  title: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
}, userId: string) {
  const tags = await upsertTags(data.tags ?? []);
  const note = await Note.create({
    userId,
    title: data.title,
    content: data.content ?? "",
    isPinned: data.isPinned ?? false,
    isFavorite: data.isFavorite ?? false,
    tags: tags.map((tag) => tag.name),
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
  },
  userId?: string
) {
  const existing = await Note.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) throw new Error("Note not found");

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.tags !== undefined) {
    const tags = await upsertTags(data.tags);
    updateData.tags = tags.map((tag) => tag.name);
  }

  const note = await Note.findByIdAndUpdate(id, updateData, { new: true });
  return mapNote(note);
}

export async function deleteNote(id: string, userId?: string) {
  const existing = await Note.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) throw new Error("Note not found");
  await Note.findByIdAndDelete(id);
}

export async function toggleNoteFavorite(id: string, userId?: string) {
  const current = await Note.findById(id);
  if (!current || (userId && current.userId.toString() !== userId)) return null;
  return updateNote(id, { isFavorite: !current.isFavorite }, userId);
}

export async function toggleNotePin(id: string, userId?: string) {
  const current = await Note.findById(id);
  if (!current || (userId && current.userId.toString() !== userId)) return null;
  return updateNote(id, { isPinned: !current.isPinned }, userId);
}

export function exportNoteAsMarkdown(note: NoteItem) {
  const tagLine =
    note.tags.length > 0
      ? `\n\n---\n\nTags: ${note.tags.map((t) => t.name).join(", ")}`
      : "";
  return `# ${note.title}\n\n${note.content}${tagLine}`;
}
