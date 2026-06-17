import { Suspense } from "react";
import { BlogsPageClient } from "@/components/blogs/blogs-page";

export default function BlogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500">Loading...</div>}>
      <BlogsPageClient />
    </Suspense>
  );
}
