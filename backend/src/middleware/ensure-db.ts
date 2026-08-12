import type { NextFunction, Request, Response } from "express";
import connectDB from "../lib/mongodb";

/**
 * Await MongoDB connectivity before handling any DB-backed route.
 * Fixes: "Cannot call findOne() before initial connection is complete"
 * when bufferCommands=false (especially on Vercel cold starts).
 */
export async function ensureDb(req: Request, res: Response, next: NextFunction) {
  try {
    await connectDB();
    next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";
    console.error("[ensureDb]", message);
    res.status(503).json({
      error: message,
    });
  }
}
