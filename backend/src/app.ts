import cors from "cors";
import express from "express";
import connectDB from "./lib/mongodb";
import blogsRouter from "./routes/blogs";
import linksRouter from "./routes/links";
import pdfsRouter from "./routes/pdfs";
import notesRouter from "./routes/notes";
import remindersRouter from "./routes/reminders";
import alarmsRouter from "./routes/alarms";
import miscRouter from "./routes/misc";
import authRouter from "./routes/auth";
import { UPLOADS_DIR } from "./lib/uploads";

const app = express();

// Connect to MongoDB
console.log('[Backend] Starting MongoDB connection...');
connectDB()
  .then(() => {
    console.log('[Backend] MongoDB connected successfully');
  })
  .catch((err) => {
    console.error("[Backend] Failed to connect to MongoDB:", err);
    process.exit(1);
  });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const allowedOrigins = [
  FRONTEND_URL,
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
      if (
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/api/uploads", express.static(UPLOADS_DIR));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/links", linksRouter);
app.use("/api/pdfs", pdfsRouter);
app.use("/api/notes", notesRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/alarms", alarmsRouter);
app.use("/api", miscRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

export default app;
export { UPLOADS_DIR };
