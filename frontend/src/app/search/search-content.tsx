"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const typeLabels = {
  blog: "Blog",
  link: "Link",
  pdf: "PDF",
  note: "Note",
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    apiFetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results ?? []));
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search Results</h1>
        <p className="text-stone-500">
          {q ? `Results for "${q}"` : "Enter a search query from the header"}
        </p>
      </div>

      <div className="space-y-3">
        {results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-stone-500">
              {q ? "No results found" : "Use the search bar to find content"}
            </CardContent>
          </Card>
        ) : (
          results.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={result.url ?? "#"}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeLabels[result.type]}</Badge>
                    <span className="font-medium">{result.title}</span>
                  </div>
                  {result.subtitle && (
                    <p className="mt-1 truncate text-sm text-stone-500">{result.subtitle}</p>
                  )}
                  <p className="mt-1 text-xs text-stone-400">{formatDate(result.createdAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
