import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "apna-sathi-dev-secret";
const JWT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthUserPayload {
  userId: string;
  mobile: string;
}

export function createAuthToken(userId: string, mobile: string) {
  return jwt.sign({ userId, mobile }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string; mobile: string; iat?: number; exp?: number };
}

export async function getCurrentUserFromRequest(req: Request) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        title: true,
        mobile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return null;
    return user;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyAuthToken(token);
    (req as Request & { user?: AuthUserPayload }).user = {
      userId: payload.userId,
      mobile: payload.mobile,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please login again." });
  }
}

export function getTokenExpiryMs() {
  return JWT_TTL_MS;
}
