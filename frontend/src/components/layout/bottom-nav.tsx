"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlarmClock, PenLine, Settings, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Capture", icon: PenLine },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/alarms", label: "Alarms", icon: AlarmClock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-semibold",
                active ? "text-brand" : "text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
