import type { NextConfig } from "next";
import path from "path";

const externalApi =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

/**
 * Root Next.js config for Vercel (Root Directory = repo root / "./").
 * Local day-to-day UI still runs via `npm run dev:frontend` in /frontend.
 */
const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    externalDir: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma", "express", "multer"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@backend": path.join(__dirname, "backend/src"),
    };
    return config;
  },
  async rewrites() {
    if (!externalApi) {
      return [
        {
          source: "/uploads/:path*",
          destination: "/api/uploads/:path*",
        },
        {
          source: "/health",
          destination: "/api/health",
        },
      ];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${externalApi}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${externalApi}/uploads/:path*`,
      },
      {
        source: "/health",
        destination: `${externalApi}/health`,
      },
    ];
  },
};

export default nextConfig;
