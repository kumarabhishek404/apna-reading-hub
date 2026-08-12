import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "../lib/auth";

export function requireUserScope(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  return requireAuth(req, res, next);
}
