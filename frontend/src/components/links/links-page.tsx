"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { CopyButton } from "@/components/shared/copy-button";
import { TagList } from "@/components/shared/tag-list";
import { apiFetch } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import type { LinkItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function LinksPageClient() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (tag) params.set("tag", tag);
    apiFetch(`/api/links?${params}`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links ?? []));
  }, [debouncedSearch, tag]);

  async function toggleFavorite(id: string) {
    const res = await apiFetch("/api/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "favorite" }),
    });
    const data = await res.json();
    if (data.link) setLinks((prev) => prev.map((l) => (l.id === id ? data.link : l)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this link?")) return;
    await apiFetch(`/api/links?id=${id}`, { method: "DELETE" });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Links</h1>
          <p className="text-stone-500">Save website links for later</p>
        </div>
        <Button onClick={() => router.push("/links/new")}>
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search links..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {links.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-stone-500">No links found</CardContent></Card>
        ) : (
          links.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/links/${link.id}`} className="text-lg font-medium hover:underline">{link.title}</Link>
                  <FavoriteButton isFavorite={link.isFavorite} onToggle={() => toggleFavorite(link.id)} />
                </div>
                <p className="text-sm text-stone-500">{link.description}</p>
                <p className="truncate text-sm text-stone-400">{link.url}</p>
                <TagList tags={link.tags} />
                <p className="text-xs text-stone-400">{formatDate(link.createdAt)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Open
                    </a>
                  </Button>
                  <CopyButton text={link.url} />
                  <Button variant="outline" size="sm" asChild><Link href={`/links/${link.id}/edit`}>Edit</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
