"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { TagWithCount } from "@/lib/types";

export function TagsPageClient() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("name");

  useEffect(() => {
    apiFetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tags</h1>
        <p className="text-stone-500">Browse and filter content by tags</p>
      </div>

      {activeTag && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-stone-600">
              Viewing tag: <strong>{activeTag}</strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/blogs?tag=${encodeURIComponent(activeTag)}`} className="text-sm text-stone-600 underline">Blogs</Link>
              <Link href={`/links?tag=${encodeURIComponent(activeTag)}`} className="text-sm text-stone-600 underline">Links</Link>
              <Link href={`/pdfs?tag=${encodeURIComponent(activeTag)}`} className="text-sm text-stone-600 underline">PDFs</Link>
              <Link href={`/notes?tag=${encodeURIComponent(activeTag)}`} className="text-sm text-stone-600 underline">Notes</Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-stone-500">No tags yet. Add tags when creating content.</p>
        ) : (
          tags.map((tag) => (
            <Link key={tag.id} href={`/tags?name=${encodeURIComponent(tag.name)}`}>
              <Badge
                variant={activeTag === tag.name ? "default" : "secondary"}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {tag.name}
                <span className="ml-1.5 text-stone-400">({tag.count})</span>
              </Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
