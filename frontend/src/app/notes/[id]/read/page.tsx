import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReadingLayout } from "@/components/layout/reading-layout";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { TagList } from "@/components/shared/tag-list";
import { apiUrl } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { NoteItem } from "@/lib/types";

async function getNote(id: string): Promise<NoteItem | null> {
  const res = await fetch(apiUrl(`/api/notes/${id}`), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.note;
}

export default async function NoteReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();

  return (
    <ReadingLayout
      title={note.title}
      backHref="/notes"
      meta={
        <div className="space-y-3">
          <p className="text-sm text-stone-500">{formatDate(note.createdAt)}</p>
          {note.isPinned && (
            <p className="text-xs font-medium text-stone-600">Pinned note</p>
          )}
          <TagList tags={note.tags} />
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/notes/${note.id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={apiUrl(`/api/notes/${note.id}?format=markdown`)} download>
                <Download className="h-4 w-4" /> Export Markdown
              </a>
            </Button>
          </div>
        </div>
      }
    >
      <MarkdownViewer content={note.content || "*Empty note*"} />
    </ReadingLayout>
  );
}
