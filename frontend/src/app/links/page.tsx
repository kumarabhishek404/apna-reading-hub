import { Suspense } from "react";
import { LinksPageClient } from "@/components/links/links-page";

export default function LinksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500">Loading...</div>}>
      <LinksPageClient />
    </Suspense>
  );
}
