import bcrypt from "bcryptjs";
import { User } from "../models";
import { createAuthToken } from "../lib/auth";
import { HttpError } from "../lib/errors";

export type RegisterPayload = {
  fullName: string;
  title: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

const normalizeMobile = (value: string) => value.replace(/\s+/g, "").trim();

export async function registerUser(payload: RegisterPayload) {
  const fullName = payload.fullName?.trim() ?? "";
  const title = payload.title?.trim() ?? "";
  const mobile = normalizeMobile(payload.mobile ?? "");
  const password = payload.password ?? "";

  if (!fullName || !title || !mobile || !password) {
    throw new HttpError(400, "Full name, title, mobile number and password are required.");
  }

  if (!/^\+?[0-9]{10,15}$/.test(mobile)) {
    throw new HttpError(400, "Please enter a valid mobile number.");
  }

  if (password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters long.");
  }

  if (password !== payload.confirmPassword) {
    throw new HttpError(400, "Password and confirm password do not match.");
  }

  const existing = await User.findOne({ mobile }).lean();
  if (existing) {
    throw new HttpError(409, "A user with this mobile number already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    title,
    mobile,
    passwordHash,
  });

  const token = createAuthToken(user._id.toString(), user.mobile);
  return {
    user: {
      id: user._id.toString(),
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
    throw new HttpError(400, "Mobile number and password are required.");
  }

  const user = await User.findOne({ mobile: normalized });
  if (!user) {
    throw new HttpError(401, "Invalid mobile number or password.");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, "Invalid mobile number or password.");
  }

  const token = createAuthToken(user._id.toString(), user.mobile);
  return {
    user: {
      id: user._id.toString(),
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
  const user = await User.findById(userId)
    .select({
      _id: 1,
      fullName: 1,
      title: 1,
      mobile: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .lean();

  if (!user) return null;

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    title: user.title,
    mobile: user.mobile,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
