"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlarmClock, Bell, Bookmark, FileText, Link2, StickyNote } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { ContentType } from "@/lib/types";

const typeConfig: Record<ContentType, { label: string; href: (id: string) => string; icon: typeof StickyNote }> = {
  blog: { label: "Blog", href: (id) => `/blogs/${id}/read`, icon: StickyNote },
  link: { label: "Link", href: (id) => `/links/${id}`, icon: Link2 },
  pdf: { label: "PDF", href: (id) => `/pdfs/${id}`, icon: FileText },
  note: { label: "Note", href: (id) => `/notes/${id}/edit`, icon: StickyNote },
  reminder: { label: "Reminder", href: () => `/reminders`, icon: Bell },
  alarm: { label: "Alarm", href: () => `/alarms`, icon: AlarmClock },
};

export default function BookmarksPage() {
  const [favorites, setFavorites] = useState<
    { id: string; type: ContentType; title: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setFavorites(d.favorites ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ListSkeleton rows={5} />;

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No Bookmarks Yet"
        description="Star your notes, PDFs, and links to save them here for quick access."
        actionLabel="Go to Notes"
        actionHref="/notes"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Bookmarks</h1>
        <p className="text-muted">Your starred items in one place</p>
      </div>
      <div className="grid gap-3">
        {favorites.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          return (
            <Link key={`${item.type}-${item.id}`} href={config.href(item.id)}>
              <Card className="hover:border-brand/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-brand/5 p-2">
                    <Icon className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <Badge variant="outline" className="mt-1">
                      {config.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
