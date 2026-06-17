"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { TagList } from "@/components/shared/tag-list";
import { apiFetch } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import type { BlogItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function BlogsPageClient() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (tag) params.set("tag", tag);
    apiFetch(`/api/blogs?${params}`)
      .then((r) => r.json())
      .then((d) => setBlogs(d.blogs ?? []));
  }, [debouncedSearch, tag]);

  async function toggleFavorite(id: string) {
    const res = await apiFetch("/api/blogs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "favorite" }),
    });
    const data = await res.json();
    if (data.blog) {
      setBlogs((prev) =>
        prev.map((b) => (b.id === id ? data.blog : b))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog?")) return;
    await apiFetch(`/api/blogs?id=${id}`, { method: "DELETE" });
    setBlogs((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blogs</h1>
          <p className="text-stone-500">Save and read blog articles</p>
        </div>
        <Button onClick={() => router.push("/blogs/new")}>
          <Plus className="h-4 w-4" />
          Add Blog
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blogs..."
          className="pl-9"
        />
      </div>

      {tag && (
        <p className="text-sm text-stone-500">
          Filtered by tag: <strong>{tag}</strong>
        </p>
      )}

      <div className="space-y-3">
        {blogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-stone-500">
              No blogs found
            </CardContent>
          </Card>
        ) : (
          blogs.map((blog) => (
            <Card key={blog.id}>
              <CardContent className="flex items-start gap-3 p-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/blogs/${blog.id}/read`}
                      className="text-lg font-medium hover:underline"
                    >
                      {blog.title}
                    </Link>
                    <FavoriteButton
                      isFavorite={blog.isFavorite}
                      onToggle={() => toggleFavorite(blog.id)}
                    />
                  </div>
                  {blog.url && (
                    <p className="truncate text-sm text-stone-500">{blog.url}</p>
                  )}
                  <TagList tags={blog.tags} />
                  <p className="text-xs text-stone-400">{formatDate(blog.createdAt)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/blogs/${blog.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(blog.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
