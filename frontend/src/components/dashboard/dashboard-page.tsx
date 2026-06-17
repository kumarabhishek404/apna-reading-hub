"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Link2,
  StickyNote,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { ContentType } from "@/lib/types";

const typeConfig: Record<
  ContentType,
  { label: string; href: (id: string) => string; icon: typeof BookOpen }
> = {
  blog: { label: "Blog", href: (id) => `/blogs/${id}/read`, icon: BookOpen },
  link: { label: "Link", href: (id) => `/links/${id}`, icon: Link2 },
  pdf: { label: "PDF", href: (id) => `/pdfs/${id}`, icon: FileText },
  note: { label: "Note", href: (id) => `/notes/${id}/read`, icon: StickyNote },
};

export function DashboardPage() {
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalLinks: 0,
    totalPdfs: 0,
    totalNotes: 0,
  });
  const [recent, setRecent] = useState<
    { id: string; type: ContentType; title: string; createdAt: string }[]
  >([]);
  const [favorites, setFavorites] = useState<
    { id: string; type: ContentType; title: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const data = await res.json();
        if (cancelled) return;
        setStats(data.stats);
        setRecent(data.recent ?? []);
        setFavorites(data.favorites ?? []);
        setError(null);
        setLoading(false);
        return true;
      } catch {
        if (!cancelled) {
          setError(
            "Could not reach the API. Make sure the backend is running (npm run dev from project root)."
          );
          setLoading(false);
        }
        return false;
      }
    }

    let retryTimer: ReturnType<typeof setInterval> | null = null;

    load().then((ok) => {
      if (!ok && !cancelled) {
        retryTimer = setInterval(async () => {
          const success = await load();
          if (success && retryTimer) clearInterval(retryTimer);
        }, 5000);
      }
    });

    return () => {
      cancelled = true;
      if (retryTimer) clearInterval(retryTimer);
    };
  }, []);

  const statCards = [
    { label: "Total Links", value: stats.totalLinks, href: "/links", icon: Link2 },
    { label: "Total Blogs", value: stats.totalBlogs, href: "/blogs", icon: BookOpen },
    { label: "Total PDFs", value: stats.totalPdfs, href: "/pdfs", icon: FileText },
    { label: "Total Notes", value: stats.totalNotes, href: "/notes", icon: StickyNote },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center text-stone-500">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center">
        <p className="text-stone-600">{error}</p>
        <p className="mt-2 text-sm text-stone-400">
          Run <code className="rounded bg-stone-100 px-1.5 py-0.5">npm run dev</code> from the project root to start both servers.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Dashboard
        </h1>
        <p className="mt-1 text-stone-500">
          Your personal reading and knowledge library
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <Icon className="h-4 w-4 text-stone-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Latest additions to your library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-sm text-stone-500">No items yet. Start adding content!</p>
            ) : (
              recent.map((item) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={config.href(item.id)}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-stone-50"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline">{config.label}</Badge>
                        <span className="text-xs text-stone-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              Favorites
            </CardTitle>
            <CardDescription>Items you&apos;ve starred</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {favorites.length === 0 ? (
              <p className="text-sm text-stone-500">
                Star items to see them here
              </p>
            ) : (
              favorites.slice(0, 8).map((item) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                return (
                  <Link
                    key={`fav-${item.type}-${item.id}`}
                    href={config.href(item.id)}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-stone-50"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <Badge variant="outline" className="mt-1">
                        {config.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
