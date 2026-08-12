import type { NextFunction, Request, Response } from "express";
import connectDB from "../lib/mongodb";

function formatDbError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Database connection failed";

  if (/IP that isn't whitelisted|whitelist|ENOTFOUND|querySrv/i.test(message)) {
    return (
      "Cannot reach MongoDB Atlas. In Atlas → Network Access, allow " +
      "0.0.0.0/0 (for Vercel) or your current IP, then retry. " +
      "Also confirm MONGODB_URI is set correctly."
    );
  }

  if (/authentication failed|bad auth/i.test(message)) {
    return (
      "MongoDB authentication failed. Check the username/password in MONGODB_URI " +
      "(URL-encode special characters in the password)."
    );
  }

  return message;
}

/**
 * Await MongoDB connectivity before handling any DB-backed route.
 */
export async function ensureDb(_req: Request, res: Response, next: NextFunction) {
  try {
    await connectDB();
    next();
  } catch (error) {
    const message = formatDbError(error);
    console.error("[ensureDb]", error);
    res.status(503).json({ error: message });
  }
}
