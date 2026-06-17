import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export const metadata: Metadata = {
  title: "Reading Hub",
  description: "Your personal knowledge library for blogs, links, PDFs, and notes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reading Hub",
  },
};

const devSwCleanupScript = `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(r) { r.unregister(); });
  });
}
if ('caches' in window) {
  caches.keys().then(function(keys) {
    keys.forEach(function(k) { caches.delete(k); });
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#fafaf9" />
        {isDev && (
          <script dangerouslySetInnerHTML={{ __html: devSwCleanupScript }} />
        )}
      </head>
      <body className="min-h-full bg-stone-50 text-stone-900 antialiased">
        <AppShell>{children}</AppShell>
        {!isDev && <ServiceWorkerRegister />}
      </body>
    </html>
  );
}
