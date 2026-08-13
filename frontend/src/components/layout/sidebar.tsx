"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlarmClock,
  Bell,
  Bookmark,
  FileText,
  LayoutDashboard,
  Link2,
  Settings,
  StickyNote,
  User,
  X,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/pdfs", label: "PDFs", icon: FileText },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/alarms", label: "Alarms", icon: AlarmClock },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string; count: number }[]>([]);

  useEffect(() => {
    apiFetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTags(d.tags ?? []))
      .catch(() => setTags([]));
  }, []);

  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <Logo onClick={onMobileClose} size="sm" />
        {onMobileClose && (
          <Button variant="ghost" size="icon" onClick={onMobileClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-brand/80 hover:bg-brand/5 hover:text-brand"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-brand"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={cn("relative z-10 h-4 w-4", active && "text-white")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}

        {/* Tags Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-brand/80 hover:bg-brand/5 hover:text-brand rounded-xl transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4" />
              <span>Tags</span>
            </div>
            {tagsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {tagsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pl-8 mt-1 space-y-1"
            >
              {tags.length === 0 ? (
                <p className="text-xs text-muted py-2">No tags yet</p>
              ) : (
                tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags?name=${encodeURIComponent(tag.name)}`}
                    onClick={onMobileClose}
                    className="block px-3 py-1.5 text-xs text-brand/70 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
                  >
                    {tag.name} <span className="text-muted/60">({tag.count})</span>
                  </Link>
                ))
              )}
              <Link
                href="/tags"
                onClick={onMobileClose}
                className="block px-3 py-1.5 text-xs text-brand-orange hover:text-brand-orange/80 hover:bg-brand-orange/5 rounded-lg transition-colors font-medium"
              >
                Manage all tags →
              </Link>
            </motion.div>
          )}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-center text-[11px] leading-relaxed text-muted">
          Apna Sathi — free productivity by{" "}
          <span className="font-medium text-brand">Apna Rojgar</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand/20 backdrop-blur-sm" onClick={onMobileClose} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute left-0 top-0 h-full w-72 border-r border-border bg-white shadow-2xl"
          >
            {content}
          </motion.aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="icon" onClick={onClick} className="lg:hidden">
      <LayoutDashboard className="h-4 w-4" />
    </Button>
  );
}
