import type { NextFunction, Request, Response } from "express";

/**
 * Tiny in-memory rate limiter for auth endpoints (no extra dependency).
 * Best-effort protection for production; replace with Redis at larger scale.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}) {
  const { windowMs, max, keyPrefix = "rl" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) ||
      req.ip ||
      "unknown";

    const mobile =
      typeof req.body?.mobile === "string" ? req.body.mobile : "";
    const identity = `${keyPrefix}:${ip}:${mobile}`;
    const now = Date.now();
    const current = buckets.get(identity);

    if (!current || current.resetAt <= now) {
      buckets.set(identity, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: `Too many attempts. Try again in ${retryAfter}s.`,
      });
      return;
    }

    next();
  };
}

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);

if (typeof cleanup.unref === "function") {
  cleanup.unref();
}
