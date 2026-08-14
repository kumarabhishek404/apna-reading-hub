import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { getEnv } from "./env";

export interface AuthUserPayload {
  userId: string;
  mobile: string;
}

const JWT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function jwtSecret() {
  return getEnv().jwtSecret;
}

export function createAuthToken(userId: string, mobile: string) {
  return jwt.sign({ userId, mobile }, jwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, jwtSecret()) as {
    userId: string;
    mobile: string;
    iat?: number;
    exp?: number;
  };
}

export async function getCurrentUserFromRequest(req: Request) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.userId)
      .select({ _id: 1, fullName: 1, title: 1, mobile: 1, createdAt: 1, updatedAt: 1 })
      .lean();

    if (!user) return null;
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      title: user.title,
      mobile: user.mobile,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
    };
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
