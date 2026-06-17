import { Suspense } from "react";
import { NotesPageClient } from "@/components/notes/notes-page";

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500">Loading...</div>}>
      <NotesPageClient />
    </Suspense>
  );
}
