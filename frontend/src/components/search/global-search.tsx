"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import type { SearchResult } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const typeLabels = {
  blog: "Blog",
  link: "Link",
  pdf: "PDF",
  note: "Note",
};

export function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const router = useRouter();

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    apiFetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => setResults(data.results ?? []))
      .catch(() => setResults([]));
  }, [debouncedQuery]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search blogs, links, PDFs, notes..."
          className="pl-9"
        />
      </div>
      {open && query.trim() && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-stone-500">
              No results found
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-1 border-b border-stone-100 px-4 py-3 text-left hover:bg-stone-50"
                    onMouseDown={() => {
                      if (result.url) router.push(result.url);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{typeLabels[result.type]}</Badge>
                      <span className="text-sm font-medium text-stone-900">
                        {result.title}
                      </span>
                    </div>
                    {result.subtitle && (
                      <span className="truncate text-xs text-stone-500">
                        {result.subtitle}
                      </span>
                    )}
                    <span className="text-xs text-stone-400">
                      {formatDate(result.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results.length > 0 && (
            <div className="border-t border-stone-100 px-4 py-2">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="text-xs font-medium text-stone-600 hover:text-stone-900"
                onMouseDown={() => setOpen(false)}
              >
                View all results
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
