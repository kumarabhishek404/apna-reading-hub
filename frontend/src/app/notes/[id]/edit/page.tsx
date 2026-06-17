"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/shared/tag-input";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NoteItem } from "@/lib/types";

export default function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ id: noteId }) => {
      setId(noteId);
      apiFetch(`/api/notes/${noteId}`).then((r) => r.json()).then((d: { note: NoteItem }) => {
        setTitle(d.note.title);
        setContent(d.note.content);
        setTags(d.note.tags.map((t) => t.name).join(", "));
      });
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await apiFetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, content, tags: tags.split(",") }),
    });
    setLoading(false);
    router.push(`/notes/${id}/read`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Edit Note</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Content</Label><MarkdownEditor value={content} onChange={setContent} /></div>
            <TagInput value={tags} onChange={setTags} />
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Update Note"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
