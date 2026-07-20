import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apna Sathi",
  description:
    "Free productivity platform by Apna Rojgar — organize notes, PDFs, links, reminders, and alarms in one place.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/apna-sathi-logo.png", type: "image/png" }],
    apple: [{ url: "/icons/apna-sathi-logo.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Apna Sathi",
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
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#22409A" />
        {isDev && (
          <script dangerouslySetInnerHTML={{ __html: devSwCleanupScript }} />
        )}
      </head>
      <body className="min-h-full bg-background font-sans text-brand antialiased">
        <AppShell>{children}</AppShell>
        <Toaster
          position="top-right"
          richColors={false}
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl border border-border bg-white text-brand shadow-lg",
              title: "font-semibold text-brand",
              description: "text-muted",
              success: "border-brand/20",
              error: "border-red-200",
            },
          }}
        />
        {!isDev && <ServiceWorkerRegister />}
      </body>
    </html>
  );
}
