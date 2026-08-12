import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "apna-sathi-dev-secret";

if (process.env.VERCEL && !process.env.JWT_SECRET) {
  console.warn(
    "[Auth] JWT_SECRET is not set on Vercel. Set a strong secret in Environment Variables."
  );
}
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
    const user = await User.findById(payload.userId).select({
      _id: 1,
      fullName: 1,
      title: 1,
      mobile: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    if (!user) return null;
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      title: user.title,
      mobile: user.mobile,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  console.log('[Auth Middleware] Checking authentication', { hasAuthHeader: !!authHeader, authHeaderLength: authHeader.length });
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.warn('[Auth Middleware] No token found');
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    console.log('[Auth Middleware] Verifying token');
    const payload = verifyAuthToken(token);
    console.log('[Auth Middleware] Token verified successfully', { userId: payload.userId, mobile: payload.mobile });
    (req as Request & { user?: AuthUserPayload }).user = {
      userId: payload.userId,
      mobile: payload.mobile,
    };
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token verification failed', error);
    return res.status(401).json({ error: "Session expired. Please login again." });
  }
}

export function getTokenExpiryMs() {
  return JWT_TTL_MS;
}
