"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { PinButton, TagList } from "@/components/shared/tag-list";
import { apiFetch, apiUrl } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import type { NoteItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function NotesPageClient() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (tag) params.set("tag", tag);
    apiFetch(`/api/notes?${params}`).then((r) => r.json()).then((d) => setNotes(d.notes ?? []));
  }, [debouncedSearch, tag]);

  async function toggleFavorite(id: string) {
    const res = await apiFetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "favorite" }),
    });
    const data = await res.json();
    if (data.note) setNotes((prev) => prev.map((n) => (n.id === id ? data.note : n)));
  }

  async function togglePin(id: string) {
    const res = await apiFetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "pin" }),
    });
    const data = await res.json();
    if (data.note) {
      setNotes((prev) => {
        const updated = prev.map((n) => (n.id === id ? data.note : n));
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    await apiFetch(`/api/notes?id=${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notes</h1>
          <p className="text-stone-500">Personal notes with Markdown support</p>
        </div>
        <Button onClick={() => router.push("/notes/new")}>
          <Plus className="h-4 w-4" /> Create Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-stone-500">No notes found</CardContent></Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className={note.isPinned ? "border-stone-400" : ""}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PinButton isPinned={note.isPinned} onToggle={() => togglePin(note.id)} />
                    <Link href={`/notes/${note.id}/read`} className="text-lg font-medium hover:underline">{note.title}</Link>
                  </div>
                  <FavoriteButton isFavorite={note.isFavorite} onToggle={() => toggleFavorite(note.id)} />
                </div>
                <p className="line-clamp-2 text-sm text-stone-500">{note.content}</p>
                <TagList tags={note.tags} />
                <p className="text-xs text-stone-400">{formatDate(note.createdAt)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild><Link href={`/notes/${note.id}/edit`}>Edit</Link></Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={apiUrl(`/api/notes/${note.id}?format=markdown`)} download>
                      <Download className="h-4 w-4" /> Export MD
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
