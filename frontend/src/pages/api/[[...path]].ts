import type { NextApiRequest, NextApiResponse } from "next";
import app from "@backend/app";
import connectDB from "@backend/lib/mongodb";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    sizeLimit: "8mb",
  },
};

function isHealthPath(url: string) {
  const path = url.split("?")[0];
  return path === "/api/health" || path === "/health";
}

/**
 * Next/Vercel sometimes hands Express a stripped URL (especially for
 * multipart). Rebuild /api/... from the catch-all slug when that happens.
 */
function restoreExpressUrl(req: NextApiRequest) {
  const parts = req.query.path;
  const fromCatchAll = Array.isArray(parts)
    ? `/api/${parts.filter(Boolean).join("/")}`
    : typeof parts === "string" && parts
      ? `/api/${parts}`
      : null;

  const raw = req.url || "/";
  const pathname = raw.split("?")[0] || "/";
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";

  const needsRestore =
    Boolean(fromCatchAll) &&
    (pathname === "/" ||
      pathname === "/api" ||
      pathname === "/api/" ||
      !pathname.startsWith("/api/"));

  if (needsRestore && fromCatchAll) {
    req.url = `${fromCatchAll}${query}`;
    return;
  }

  if (
    pathname !== "/health" &&
    !pathname.startsWith("/uploads") &&
    !pathname.startsWith("/api/")
  ) {
    req.url = `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}${query}`;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  restoreExpressUrl(req);
  const url = req.url || "/";

  if (!isHealthPath(url)) {
    try {
      // Cold-start safety for Vercel: connect before Express handles DB routes.
      await connectDB();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Database connection failed";
      console.error("[api catch-all] MongoDB connection failed:", message);
      return res.status(503).json({ error: message });
    }
  }

  return app(req, res);
}
