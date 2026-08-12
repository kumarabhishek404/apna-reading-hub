import type { Request, Response, NextFunction } from "express";
import { getCurrentUserFromRequest } from "../lib/auth";

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const user = await getCurrentUserFromRequest(req);
  (req as Request & { user?: { id: string; mobile: string; fullName: string; title: string } }).user = user
    ? {
        id: user.id,
        mobile: user.mobile,
        fullName: user.fullName,
        title: user.title,
      }
    : undefined;
  next();
}
