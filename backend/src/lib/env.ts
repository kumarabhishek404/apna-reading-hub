/**
 * Environment validation for production readiness.
 * Call once at process start (index.ts / app warm-up).
 */

export type AppEnv = {
  nodeEnv: string;
  isProd: boolean;
  isVercel: boolean;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  frontendUrl: string;
};

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function loadEnv(): AppEnv {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  const isVercel = Boolean(process.env.VERCEL);

  const jwtSecret =
    process.env.JWT_SECRET?.trim() ||
    (!isProd && !isVercel ? "apna-sathi-dev-secret" : "");

  if ((isProd || isVercel) && (!jwtSecret || jwtSecret === "change-me-to-a-long-random-string")) {
    throw new Error(
      "JWT_SECRET must be set to a strong unique value in production (Vercel/Render env vars)."
    );
  }

  let mongodbUri = process.env.MONGODB_URI?.trim() || "";
  if (!mongodbUri) {
    if (isVercel || isProd) {
      throw new Error("MONGODB_URI is required in production.");
    }
    mongodbUri = "mongodb://localhost:27017/reading-hub";
  }

  return {
    nodeEnv,
    isProd,
    isVercel,
    port: Number(process.env.PORT || 4001),
    mongodbUri,
    jwtSecret: required("JWT_SECRET", jwtSecret),
    frontendUrl: process.env.FRONTEND_URL?.trim() || "http://localhost:3000",
  };
}

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cached) cached = loadEnv();
  return cached;
}
