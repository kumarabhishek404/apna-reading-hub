import { Suspense } from "react";
import { TagsPageClient } from "@/components/tags/tags-page";

export default function TagsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500">Loading...</div>}>
      <TagsPageClient />
    </Suspense>
  );
}
