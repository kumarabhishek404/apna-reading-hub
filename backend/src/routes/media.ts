import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/errors";
import { UPLOADS_DIR } from "../lib/uploads";

const router = Router();
router.use(requireAuth);

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const onVercel = Boolean(process.env.VERCEL);

const upload = multer({
  storage: onVercel
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
        filename: (_req, file, cb) => {
          const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          cb(null, safeName);
        },
      }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed.has(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image or PDF files are allowed"));
  },
});

function stripDataUrlPrefix(data: string) {
  const comma = data.indexOf(",");
  return data.startsWith("data:") && comma >= 0 ? data.slice(comma + 1) : data;
}

function dataUrl(mimeType: string, base64: string) {
  return `data:${mimeType};base64,${stripDataUrlPrefix(base64)}`;
}

function persistBuffer(name: string, mimeType: string, buffer: Buffer) {
  if (onVercel) {
    return dataUrl(mimeType, buffer.toString("base64"));
  }
  const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, safeName), buffer);
  return `/uploads/${safeName}`;
}

router.post(
  "/upload",
  (req, res, next) => {
    const contentType = String(req.headers["content-type"] || "");
    if (contentType.includes("application/json")) {
      next();
      return;
    }
    upload.single("file")(req, res, (err) => {
      if (err) {
        next(new HttpError(400, err.message || "Upload failed"));
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (req.file) {
      const mimeType = req.file.mimetype || "application/octet-stream";
      const name = req.file.originalname || "file";
      const url = req.file.buffer
        ? persistBuffer(name, mimeType, req.file.buffer)
        : `/uploads/${req.file.filename}`;
      res.status(201).json({ url, name, mimeType });
      return;
    }

    const body = req.body as { data?: string; name?: string; mimeType?: string } | undefined;
    const data = typeof body?.data === "string" ? body.data.trim() : "";
    if (!data) throw new HttpError(400, "Image or PDF file required");

    const mimeType = body?.mimeType || "image/jpeg";
    if (!allowed.has(mimeType) && !mimeType.startsWith("image/")) {
      throw new HttpError(400, "Only image or PDF files are allowed");
    }

    const name = body?.name || "file";
    const url = persistBuffer(name, mimeType, Buffer.from(stripDataUrlPrefix(data), "base64"));
    res.status(201).json({ url, name, mimeType });
  })
);

export default router;
