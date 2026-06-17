import { prisma } from "../lib/prisma";
import type { NoteItem } from "../lib/types";
import { upsertTags } from "./tag.service";

const noteInclude = {
  tags: { include: { tag: true } },
} as const;

function mapNote(note: {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: string; name: string } }[];
}): NoteItem {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    isPinned: note.isPinned,
    isFavorite: note.isFavorite,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags.map((t) => t.tag),
  };
}

export async function getNotes(search?: string, tag?: string) {
  const notes = await prisma.note.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search } },
                { content: { contains: search } },
              ],
            }
          : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
      ],
    },
    include: noteInclude,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
  return notes.map(mapNote);
}

export async function getNoteById(id: string) {
  const note = await prisma.note.findUnique({
    where: { id },
    include: noteInclude,
  });
  return note ? mapNote(note) : null;
}

export async function createNote(data: {
  title: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
}) {
  const tags = await upsertTags(data.tags ?? []);
  const note = await prisma.note.create({
    data: {
      title: data.title,
      content: data.content ?? "",
      isPinned: data.isPinned ?? false,
      isFavorite: data.isFavorite ?? false,
      tags: {
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
    },
    include: noteInclude,
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
  }
) {
  if (data.tags) {
    const tags = await upsertTags(data.tags);
    await prisma.noteTag.deleteMany({ where: { noteId: id } });
    await prisma.noteTag.createMany({
      data: tags.map((tag) => ({ noteId: id, tagId: tag.id })),
    });
  }

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      isPinned: data.isPinned,
      isFavorite: data.isFavorite,
    },
    include: noteInclude,
  });
  return mapNote(note);
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } });
}

export async function toggleNoteFavorite(id: string) {
  const current = await prisma.note.findUnique({ where: { id } });
  if (!current) return null;
  return updateNote(id, { isFavorite: !current.isFavorite });
}

export async function toggleNotePin(id: string) {
  const current = await prisma.note.findUnique({ where: { id } });
  if (!current) return null;
  return updateNote(id, { isPinned: !current.isPinned });
}

export function exportNoteAsMarkdown(note: NoteItem) {
  const tagLine =
    note.tags.length > 0
      ? `\n\n---\n\nTags: ${note.tags.map((t) => t.name).join(", ")}`
      : "";
  return `# ${note.title}\n\n${note.content}${tagLine}`;
}
