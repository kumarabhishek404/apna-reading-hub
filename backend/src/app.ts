import cors from "cors";
import express from "express";
import connectDB, { getDbReadyState } from "./lib/mongodb";
import { getEnv } from "./lib/env";
import { ensureDb } from "./middleware/ensure-db";
import { errorHandler, notFoundHandler } from "./lib/async-handler";
import blogsRouter from "./routes/blogs";
import linksRouter from "./routes/links";
import pdfsRouter from "./routes/pdfs";
import notesRouter from "./routes/notes";
import remindersRouter from "./routes/reminders";
import alarmsRouter from "./routes/alarms";
import tagsRouter from "./routes/tags";
import miscRouter from "./routes/misc";
import authRouter from "./routes/auth";
import { UPLOADS_DIR } from "./lib/uploads";

// Validate env early so misconfigured production fails fast.
const env = getEnv();

const app = express();

if (env.isProd || env.isVercel) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

const allowedOrigins = [
  env.frontendUrl,
  "http://localhost:3000",
  process.env.RENDER_EXTERNAL_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter((origin): origin is string => Boolean(origin));

const isLocalExpoOrigin = (origin: string) => {
  const normalized = origin.toLowerCase();
  return (
    normalized.startsWith("http://localhost") ||
    normalized.startsWith("http://127.0.0.1") ||
    normalized.startsWith("http://10.0.2.2") ||
    normalized.startsWith("http://192.168.") ||
    normalized.startsWith("http://172.") ||
    normalized.startsWith("exp://") ||
    normalized.startsWith("expo://") ||
    normalized.startsWith("http://[::1]")
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isLocalExpoOrigin(origin)) {
        callback(null, true);
        return;
      }
      if (origin.endsWith(".onrender.com") || origin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }
      // Do not throw — throwing breaks the request pipeline.
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/api/uploads", express.static(UPLOADS_DIR));

function healthPayload() {
  const dbState = getDbReadyState();
  const db =
    dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";
  return {
    status: "ok",
    env: env.nodeEnv,
    db,
    time: new Date().toISOString(),
  };
}

app.get("/health", (_req, res) => {
  res.json(healthPayload());
});
app.get("/api/health", (_req, res) => {
  res.json(healthPayload());
});

if (!env.isVercel) {
  connectDB().catch((err) => {
    console.error("[Backend] Initial MongoDB connection failed:", err);
  });
}

app.use("/api", ensureDb);

app.use("/api/auth", authRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/links", linksRouter);
app.use("/api/pdfs", pdfsRouter);
app.use("/api/notes", notesRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/alarms", alarmsRouter);
app.use("/api/tags", tagsRouter);
app.use("/api", miscRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export { UPLOADS_DIR };
