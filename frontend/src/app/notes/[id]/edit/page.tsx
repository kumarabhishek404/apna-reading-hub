"use client";

import { useEffect, useState } from "react";
import { NoteEditor } from "@/components/notes/note-editor";

export default function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");

  useEffect(() => {
    params.then(({ id: noteId }) => setId(noteId));
  }, [params]);

  if (!id) return <p className="p-8 text-muted">Loading...</p>;
  return <NoteEditor noteId={id} />;
}
