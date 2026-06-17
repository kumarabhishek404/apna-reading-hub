import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import blogsRouter from "./routes/blogs";
import linksRouter from "./routes/links";
import pdfsRouter from "./routes/pdfs";
import notesRouter from "./routes/notes";
import miscRouter from "./routes/misc";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  process.env.RENDER_EXTERNAL_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (origin.endsWith(".onrender.com")) {
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/blogs", blogsRouter);
app.use("/api/links", linksRouter);
app.use("/api/pdfs", pdfsRouter);
app.use("/api/notes", notesRouter);
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

app.listen(PORT, () => {
  console.log(`Reading Hub API running on port ${PORT}`);
});
