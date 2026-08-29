"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, PenLine, Search, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { apiFetch, assetUrl } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { noteContains, noteMatchesText, type NoteContainsKind } from "@/lib/noteContains";
import { noteCardSnippet, noteHeadline } from "@/lib/noteHeadline";
import { parseSearchQuery } from "@/lib/searchQuery";
import type { BlogItem, LinkItem, NoteItem, PdfItem, ReminderItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterId = "all" | NoteContainsKind | "reminder";
type TimeFilter = "all" | "monthly" | "yearly";
type BoardEntry =
  | { kind: "note"; item: NoteItem }
  | { kind: "reminder"; item: ReminderItem }
  | { kind: "blog"; item: BlogItem }
  | { kind: "link"; item: LinkItem }
  | { kind: "pdf"; item: PdfItem };

const PALETTES = [
  { bg: "#EEF2FF", title: "#0F172A", date: "#64748B", body: "#475569", tag: "#3730A3", border: "#C7D2FE", accent: "#4F46E5" },
  { bg: "#F7F4EE", title: "#0F172A", date: "#64748B", body: "#57534E", tag: "#92400E", border: "#E7E0D4", accent: "#B45309" },
  { bg: "#F4EEF8", title: "#0F172A", date: "#64748B", body: "#57534E", tag: "#6B21A8", border: "#E9D5FF", accent: "#7C3AED" },
  { bg: "#ECF6F1", title: "#0F172A", date: "#64748B", body: "#3F4F46", tag: "#166534", border: "#CDEAD7", accent: "#15803D" },
  { bg: "#F8EEF2", title: "#0F172A", date: "#64748B", body: "#57534E", tag: "#9F1239", border: "#F8D4DC", accent: "#BE123C" },
  { bg: "#F1F5F9", title: "#0F172A", date: "#64748B", body: "#475569", tag: "#334155", border: "#D8E0EA", accent: "#22409A" },
];

const REMINDER_PALETTE = {
  bg: "#FFF4EB",
  title: "#0F172A",
  date: "#9A6B4A",
  body: "#7C4A2E",
  tag: "#C2410C",
  border: "#FEDFC8",
  accent: "#EA580C",
};

const FILTERS: Array<{ id: FilterId; label: string; color: string }> = [
  { id: "all", label: "All", color: "#22409A" },
  { id: "link", label: "Links", color: "#15803D" },
  { id: "pdf", label: "PDFs", color: "#BE123C" },
  { id: "image", label: "Photos", color: "#0284C7" },
  { id: "handwriting", label: "Handwritten", color: "#1A327A" },
  { id: "reminder", label: "Reminders", color: "#EA580C" },
];

function paletteForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

function formatBoardDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function matchesTimeFilter(createdAt: string, time: TimeFilter) {
  if (time === "all") return true;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date();
  if (time === "monthly") cutoff.setMonth(cutoff.getMonth() - 1);
  else cutoff.setFullYear(cutoff.getFullYear() - 1);
  return date >= cutoff;
}

function entryMatches(entry: BoardEntry, filter: FilterId, query: string, time: TimeFilter) {
  if (!matchesTimeFilter(entry.item.createdAt, time)) return false;
  const parsed = parseSearchQuery(query);
  const kind = filter === "all" ? parsed.contains : filter === "reminder" ? null : filter;
  const text = parsed.text || (kind || filter === "reminder" ? "" : query.trim());

  if (filter === "reminder") {
    if (entry.kind !== "reminder") return false;
    if (!text) return true;
    return `${entry.item.title} ${entry.item.description || ""}`.toLowerCase().includes(text.toLowerCase());
  }
  if (entry.kind === "reminder") return false;

  if (kind === "link") {
    const isLink =
      entry.kind === "link" ||
      (entry.kind === "blog" && Boolean(entry.item.url)) ||
      (entry.kind === "note" && noteContains(entry.item, "link"));
    if (!isLink) return false;
    if (!text) return true;
    if (entry.kind === "note") return noteMatchesText(entry.item, text);
    return `${entry.item.title} ${"url" in entry.item ? entry.item.url || "" : ""}`.toLowerCase().includes(text.toLowerCase());
  }
  if (kind === "pdf") {
    const isPdf = entry.kind === "pdf" || (entry.kind === "note" && noteContains(entry.item, "pdf"));
    if (!isPdf) return false;
    if (!text) return true;
    if (entry.kind === "note") return noteMatchesText(entry.item, text);
    return entry.item.title.toLowerCase().includes(text.toLowerCase());
  }
  if (kind === "image") {
    if (!(entry.kind === "note" && noteContains(entry.item, "image"))) return false;
    return !text || noteMatchesText(entry.item, text);
  }
  if (kind === "handwriting") {
    if (!(entry.kind === "note" && noteContains(entry.item, "handwriting"))) return false;
    return !text || noteMatchesText(entry.item, text);
  }
  if (!text) return true;
  if (entry.kind === "note") return noteMatchesText(entry.item, text);
  return entry.item.title.toLowerCase().includes(text.toLowerCase());
}

function entryHref(entry: BoardEntry) {
  if (entry.kind === "note") return `/notes/${entry.item.id}/edit`;
  if (entry.kind === "reminder") return "/reminders";
  if (entry.kind === "blog") return `/blogs/${entry.item.id}/edit`;
  if (entry.kind === "link") return `/links/${entry.item.id}/edit`;
  return `/pdfs/${entry.item.id}`;
}

function entryImages(entry: BoardEntry) {
  if (entry.kind !== "note") return [];
  return (entry.item.blocks || [])
    .filter((block) => (block.type === "image" || block.type === "handwriting") && block.url)
    .map((block) => assetUrl(block.url || ""))
    .filter(Boolean);
}

export function NotesPageClient() {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const debouncedSearch = useDebounce(search);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const queryFilter = searchParams?.get("filter");
    if (queryFilter === "reminder" || queryFilter === "link" || queryFilter === "pdf" || queryFilter === "image" || queryFilter === "handwriting") {
      setFilter(queryFilter);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/notes").then((r) => r.json()),
      apiFetch("/api/reminders").then((r) => r.json()).catch(() => ({ reminders: [] })),
      apiFetch("/api/blogs").then((r) => r.json()).catch(() => ({ blogs: [] })),
      apiFetch("/api/links").then((r) => r.json()).catch(() => ({ links: [] })),
      apiFetch("/api/pdfs").then((r) => r.json()).catch(() => ({ pdfs: [] })),
    ])
      .then(([notes, reminders, blogs, links, pdfs]) => {
        const combined: BoardEntry[] = [
          ...(notes.notes ?? []).map((item: NoteItem) => ({ kind: "note" as const, item })),
          ...(reminders.reminders ?? []).map((item: ReminderItem) => ({ kind: "reminder" as const, item })),
          ...(blogs.blogs ?? []).map((item: BlogItem) => ({ kind: "blog" as const, item })),
          ...(links.links ?? []).map((item: LinkItem) => ({ kind: "link" as const, item })),
          ...(pdfs.pdfs ?? []).map((item: PdfItem) => ({ kind: "pdf" as const, item })),
        ].sort((a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime());
        setEntries(combined);
      })
      .catch(() => toast.error("Could not load notes"));
  }, []);

  const visible = useMemo(
    () => entries.filter((entry) => entryMatches(entry, filter, debouncedSearch, timeFilter)),
    [entries, filter, debouncedSearch, timeFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Apna Notes</h1>
          <p className="text-muted">Notes, links, PDFs, photos, and reminders — same board as the mobile app.</p>
        </div>
        <Button onClick={() => router.push("/")}>
          <PenLine className="h-4 w-4" /> Capture
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes, pdfs, links, reminders"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Filter className="h-4 w-4" />
          <button
            type="button"
            className={cn("rounded-full px-3 py-1", timeFilter === "all" && "bg-brand text-white")}
            onClick={() => setTimeFilter("all")}
          >
            All time
          </button>
          <button
            type="button"
            className={cn("rounded-full px-3 py-1", timeFilter === "monthly" && "bg-brand text-white")}
            onClick={() => setTimeFilter("monthly")}
          >
            Month
          </button>
          <button
            type="button"
            className={cn("rounded-full px-3 py-1", timeFilter === "yearly" && "bg-brand text-white")}
            onClick={() => setTimeFilter("yearly")}
          >
            Year
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold",
              filter === item.id ? "text-white" : "bg-white text-slate-600"
            )}
            style={{
              background: filter === item.id ? item.color : "white",
              borderColor: item.color,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Nothing here yet"
          description="Capture a note, link, PDF, alarm, or reminder from the home screen."
          actionLabel="Capture"
          actionHref="/"
        />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visible.map((entry) => {
            const palette = entry.kind === "reminder" ? REMINDER_PALETTE : paletteForId(entry.item.id);
            const title =
              entry.kind === "note"
                ? noteHeadline(entry.item)
                : entry.item.title;
            const snippet =
              entry.kind === "note"
                ? noteCardSnippet(entry.item, title)
                : "description" in entry.item
                  ? entry.item.description
                  : "";
            const images = entryImages(entry);
            return (
              <Link
                key={`${entry.kind}-${entry.item.id}`}
                href={entryHref(entry)}
                className="mb-4 block break-inside-avoid rounded-[20px] border p-4 pl-5 shadow-sm"
                style={{ background: palette.bg, borderColor: palette.border, borderLeftWidth: 3, borderLeftColor: palette.accent }}
              >
                <p className="text-[11px] font-semibold" style={{ color: palette.date }}>
                  {formatBoardDate(entry.item.createdAt)}
                </p>
                <h2 className="text-sm font-bold" style={{ color: palette.title }}>
                  {title}
                </h2>
                {entry.kind === "reminder" && (
                  <span className="mt-2 inline-flex rounded-full bg-amber-200 px-2 py-1 text-[11px] font-extrabold text-stone-900">
                    {new Date(entry.item.dueAt).toLocaleString()}
                  </span>
                )}
                {images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {images.slice(0, 2).map((src) => (
                      <img key={src} src={src} alt="" className="h-20 w-full rounded-xl object-cover" />
                    ))}
                  </div>
                )}
                {snippet && snippet.toLowerCase() !== title.toLowerCase() && (
                  <p className="mt-2 line-clamp-4 text-[13px]" style={{ color: palette.body }}>
                    {snippet}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
