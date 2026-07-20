#!/usr/bin/env node
/**
 * Prepares Prisma for Vercel: use PostgreSQL schema and generate the client.
 * Requires DATABASE_URL (Postgres) in the Vercel project env.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const prismaDir = path.join(root, "backend", "prisma");
const sqliteSchema = path.join(prismaDir, "schema.prisma");
const postgresSchema = path.join(prismaDir, "schema.postgresql.prisma");

const databaseUrl = process.env.DATABASE_URL || "";
const usePostgres =
  process.env.VERCEL === "1" ||
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("postgresql://");

if (usePostgres) {
  if (!fs.existsSync(postgresSchema)) {
    console.error("Missing backend/prisma/schema.postgresql.prisma");
    process.exit(1);
  }
  fs.copyFileSync(postgresSchema, sqliteSchema);
  console.log("Using PostgreSQL Prisma schema for Vercel/production.");
} else {
  console.log("Keeping local SQLite Prisma schema.");
}

execSync("npx prisma generate", {
  cwd: path.join(root, "backend"),
  stdio: "inherit",
  env: {
    ...process.env,
    // prisma generate needs the var present when schema uses env("DATABASE_URL")
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgresql://user:pass@localhost:5432/readinghub?schema=public",
  },
});

if (usePostgres && databaseUrl) {
  try {
    execSync("npx prisma db push --skip-generate", {
      cwd: path.join(root, "backend"),
      stdio: "inherit",
      env: process.env,
    });
  } catch (err) {
    console.warn(
      "prisma db push skipped or failed (set DATABASE_URL to a reachable Postgres DB)."
    );
  }
}
