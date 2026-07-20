"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlarmClock,
  Bell,
  FileText,
  Link2,
  Plus,
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
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/motion";
import { DashboardSkeleton } from "@/components/shared/skeleton";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { ContentType } from "@/lib/types";

const typeConfig: Record<
  ContentType,
  { label: string; href: (id: string) => string; icon: typeof StickyNote }
> = {
  blog: { label: "Blog", href: (id) => `/blogs/${id}/read`, icon: StickyNote },
  link: { label: "Link", href: (id) => `/links/${id}`, icon: Link2 },
  pdf: { label: "PDF", href: (id) => `/pdfs/${id}`, icon: FileText },
  note: { label: "Note", href: (id) => `/notes/${id}/read`, icon: StickyNote },
  reminder: { label: "Reminder", href: () => `/reminders`, icon: Bell },
  alarm: { label: "Alarm", href: () => `/alarms`, icon: AlarmClock },
};

const quickActions = [
  { label: "New Note", href: "/notes/new", icon: StickyNote },
  { label: "Upload PDF", href: "/pdfs", icon: FileText },
  { label: "Save Link", href: "/links/new", icon: Link2 },
  { label: "Add Reminder", href: "/reminders", icon: Bell },
];

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
          setError("Could not reach Apna Sathi. Please check your connection.");
          setLoading(false);
        }
        return false;
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    { label: "Notes", value: stats.totalNotes, href: "/notes", icon: StickyNote },
    { label: "PDFs", value: stats.totalPdfs, href: "/pdfs", icon: FileText },
    { label: "Links", value: stats.totalLinks, href: "/links", icon: Link2 },
    { label: "Bookmarks", value: favorites.length, href: "/bookmarks", icon: Star },
  ];

  const recentNotes = recent.filter((r) => r.type === "note").slice(0, 4);
  const recentPdfs = recent.filter((r) => r.type === "pdf").slice(0, 4);
  const recentLinks = recent.filter((r) => r.type === "link").slice(0, 4);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-white p-12 text-center">
        <p className="text-brand">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <FadeIn>
        <section className="overflow-hidden rounded-2xl border border-border bg-brand p-6 text-white shadow-lg md:p-8">
          <p className="text-sm font-medium text-white/80">Welcome to Apna Sathi</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Organize Everything In One Place
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85 md:text-base">
            Your free personal productivity workspace by Apna Rojgar — store notes,
            PDFs, links, reminders, and alarms beautifully.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.label} variant="secondary" asChild className="border-white/20 bg-white/10 text-white hover:bg-brand-orange hover:text-white">
                <Link href={action.href}>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <FadeIn key={stat.label} delay={index * 0.05}>
              <Link href={stat.href}>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Card className="hover:border-brand/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>{stat.label}</CardDescription>
                      <div className="rounded-lg bg-brand/5 p-2">
                        <Icon className="h-4 w-4 text-brand" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-brand">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            </FadeIn>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSection title="Recent Notes" items={recentNotes} empty="No notes yet" href="/notes/new" />
        <RecentSection title="Recent PDFs" items={recentPdfs} empty="No PDFs yet" href="/pdfs" />
        <RecentSection title="Recent Links" items={recentLinks} empty="No links yet" href="/links/new" />
        <ComingSoonCard
          title="Upcoming Reminders"
          description="Set reminders and never miss important tasks."
          icon={Bell}
          href="/reminders"
        />
        <ComingSoonCard
          title="Today's Alarms"
          description="Manage your daily alarms in one clean view."
          icon={AlarmClock}
          href="/alarms"
        />
        <FavoritesSection favorites={favorites} />
      </div>
    </div>
  );
}

function RecentSection({
  title,
  items,
  empty,
  href,
}: {
  title: string;
  items: { id: string; type: ContentType; title: string; createdAt: string }[];
  empty: string;
  href: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Latest updates</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>
            <Plus className="h-4 w-4" /> Add
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted">{empty}</p>
        ) : (
          items.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={config.href(item.id)}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-brand/5"
              >
                <div className="rounded-lg bg-brand/5 p-2">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function ComingSoonCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: typeof Bell;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand-orange" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="outline" className="border-brand-orange/30 text-brand-orange">
          Coming soon
        </Badge>
        <Button variant="secondary" size="sm" className="mt-4" asChild>
          <Link href={href}>Explore</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function FavoritesSection({
  favorites,
}: {
  favorites: { id: string; type: ContentType; title: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-4 w-4 text-brand-orange" />
          Bookmarks
        </CardTitle>
        <CardDescription>Items you&apos;ve starred</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {favorites.length === 0 ? (
          <p className="text-sm text-muted">Star items to bookmark them here.</p>
        ) : (
          favorites.slice(0, 6).map((item) => {
            const config = typeConfig[item.type];
            return (
              <Link
                key={`fav-${item.type}-${item.id}`}
                href={config.href(item.id)}
                className="block rounded-xl p-3 text-sm font-medium transition-colors hover:bg-brand/5"
              >
                {item.title}
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
