#!/usr/bin/env node
/**
 * Vercel build prep after the MongoDB migration.
 * Prisma/Postgres schema generation is no longer required.
 *
 * Requires MONGODB_URI in the Vercel project environment at runtime.
 */
const uri = process.env.MONGODB_URI || "";

if (process.env.VERCEL === "1") {
  if (!uri) {
    console.warn(
      "[vercel-prep] MONGODB_URI is not set. API routes that touch the DB will fail at runtime until you add it in Vercel → Settings → Environment Variables."
    );
  } else {
    console.log("[vercel-prep] MongoDB configured for Vercel (mongoose). Skipping Prisma steps.");
  }
} else {
  console.log("[vercel-prep] Local/non-Vercel build — no Prisma prep needed.");
}

process.exit(0);
