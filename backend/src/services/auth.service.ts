import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { createAuthToken } from "../lib/auth";

export type RegisterPayload = {
  fullName: string;
  title: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

const normalizeMobile = (value: string) => value.replace(/\s+/g, "").trim();

export async function registerUser(payload: RegisterPayload) {
  const fullName = payload.fullName.trim();
  const title = payload.title.trim();
  const mobile = normalizeMobile(payload.mobile);
  const password = payload.password;

  if (!fullName || !title || !mobile || !password) {
    throw new Error("Full name, title, mobile number and password are required.");
  }

  if (!/^\+?[0-9]{10,15}$/.test(mobile)) {
    throw new Error("Please enter a valid mobile number.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (password !== payload.confirmPassword) {
    throw new Error("Password and confirm password do not match.");
  }

  const existing = await prisma.user.findUnique({ where: { mobile } });
  if (existing) {
    throw new Error("A user with this mobile number already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName,
      title,
      mobile,
      passwordHash,
    },
  });

  const token = createAuthToken(user.id, user.mobile);
  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      title: user.title,
      mobile: user.mobile,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function loginUser(mobile: string, password: string) {
  const normalized = normalizeMobile(mobile);
  if (!normalized || !password) {
    throw new Error("Mobile number and password are required.");
  }

  const user = await prisma.user.findUnique({ where: { mobile: normalized } });
  if (!user) {
    throw new Error("Invalid mobile number or password.");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new Error("Invalid mobile number or password.");
  }

  const token = createAuthToken(user.id, user.mobile);
  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      title: user.title,
      mobile: user.mobile,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      title: true,
      mobile: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
