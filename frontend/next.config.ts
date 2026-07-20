import type { NextConfig } from "next";

const externalApi =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

// When no external API URL is set, Express runs inside this Next.js deployment
// (Vercel). Local monorepo still sets NEXT_PUBLIC_API_URL=http://localhost:4000.
const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow importing the Express app from ../backend
  experimental: {
    externalDir: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma", "express", "multer"],
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
