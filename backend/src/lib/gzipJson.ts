import { gzipSync } from "zlib";
import type { Request, Response, NextFunction } from "express";

const MIN_BYTES = 1024;

/**
 * Gzip JSON responses when the client accepts it. Avoids an extra npm
 * dependency while cutting payload size on note/search lists.
 */
export function gzipJson(req: Request, res: Response, next: NextFunction) {
  const accept = String(req.headers["accept-encoding"] || "");
  if (!/\bgzip\b/i.test(accept)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    try {
      const json = JSON.stringify(body);
      if (!json || json.length < MIN_BYTES) {
        return originalJson(body);
      }
      const compressed = gzipSync(Buffer.from(json), { level: 6 });
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Length", String(compressed.length));
      return res.status(res.statusCode || 200).end(compressed);
    } catch {
      return originalJson(body);
    }
  }) as typeof res.json;

  next();
}
