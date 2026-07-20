"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { GlobalSearch } from "@/components/search/global-search";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/motion";
import { NotificationMonitor } from "@/components/notifications/notification-monitor";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border glass-panel">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="hidden items-center gap-2 lg:flex">
              <LogoMark size="sm" />
              <div>
                <p className="text-sm font-semibold text-brand">Apna Sathi</p>
                <p className="text-[11px] text-muted">Organize everything in one place</p>
              </div>
            </div>
            <GlobalSearch className="mx-auto flex-1 max-w-xl" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Profile menu">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Apna Sathi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/bookmarks">Bookmarks</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <NotificationMonitor />
      </div>
    </div>
  );
}
