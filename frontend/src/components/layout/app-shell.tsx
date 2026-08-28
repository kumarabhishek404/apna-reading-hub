"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageFrame } from "@/components/layout/page-frame";
import { GlobalSearch } from "@/components/search/global-search";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/motion";
import { NotificationMonitor } from "@/components/notifications/notification-monitor";
import { readAuthSession, clearAuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);

    if (PUBLIC_PATHS.has(pathname || "")) {
      return;
    }

    const session = readAuthSession();
    if (!session) {
      clearAuthSession();
      router.replace("/login");
    }
  }, [pathname, router]);

  if (!hydrated) {
    return null;
  }

  if (PUBLIC_PATHS.has(pathname || "")) {
    return <>{children}</>;
  }

  const session = readAuthSession();
  if (!session) {
    return null;
  }

  const isCapture = pathname === "/";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {!isCapture && (
          <header className="sticky top-0 z-40 border-b border-border glass-panel">
            <PageFrame className="flex items-center gap-3 py-3">
              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                <LogoMark size="sm" />
                <div>
                  <p className="text-sm font-semibold text-brand">Apna Notes</p>
                  <p className="text-[11px] text-muted">Your Personal Notebook</p>
                </div>
              </div>
              <GlobalSearch className="min-w-0 flex-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Profile menu">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>{session.user.fullName || "Apna Notes"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      clearAuthSession();
                      router.replace("/login");
                    }}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PageFrame>
          </header>
        )}
        <main className={cn("flex-1", isCapture ? "pb-24 lg:pb-0" : "py-6 pb-24 lg:pb-6")}>
          {isCapture ? (
            <PageTransition>{children}</PageTransition>
          ) : (
            <PageFrame>
              <PageTransition>{children}</PageTransition>
            </PageFrame>
          )}
        </main>
        <BottomNav />
        <NotificationMonitor />
      </div>
    </div>
  );
}
