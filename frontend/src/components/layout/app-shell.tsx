"use client";

import { useState } from "react";
import { Sidebar, MobileMenuButton } from "@/components/layout/sidebar";
import { GlobalSearch } from "@/components/search/global-search";
import { InstallPWA } from "@/components/pwa/install-button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
            <GlobalSearch className="flex-1 max-w-xl" />
            <InstallPWA />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
