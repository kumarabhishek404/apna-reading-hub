"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import type { ContentType, SearchResult } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const typeLabels: Record<ContentType, string> = {
  blog: "Blog",
  link: "Link",
  pdf: "PDF",
  note: "Note",
  reminder: "Reminder",
  alarm: "Alarm",
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search notes, PDFs, links..."
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              setResults([]);
            }}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
          >
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                No results found
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {results.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors hover:bg-brand/5"
                      onMouseDown={() => {
                        if (result.url) router.push(result.url);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{typeLabels[result.type]}</Badge>
                        <span className="text-sm font-medium text-brand">
                          {result.title}
                        </span>
                      </div>
                      {result.subtitle && (
                        <span className="truncate text-xs text-muted">
                          {result.subtitle}
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        {formatDate(result.createdAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
