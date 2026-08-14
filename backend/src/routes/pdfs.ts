import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/errors";
import { UPLOADS_DIR } from "../lib/uploads";
import {
  createPdf,
  deletePdf,
  getPdfById,
  getPdfs,
  togglePdfFavorite,
  updatePdf,
} from "../services/pdf.service";

const router = Router();
router.use(requireAuth);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || undefined;
    const tag = (req.query.tag as string) || undefined;
    const userId = (req as any).user?.userId as string;
    const pdfs = await getPdfs(search, tag, userId);
    res.json({ pdfs });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    const pdf = await getPdfById(req.params.id, userId);
    if (!pdf) throw new HttpError(404, "PDF not found");
    res.json({ pdf });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    if (!req.body?.title?.trim()) throw new HttpError(400, "Title is required");
    if (!req.body?.pdfUrl?.trim()) throw new HttpError(400, "pdfUrl is required");
    const pdf = await createPdf(req.body, userId);
    res.status(201).json({ pdf });
  })
);

router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        next(new HttpError(400, err.message || "Upload failed"));
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    if (!req.file) throw new HttpError(400, "PDF file required");

    const title = (req.body.title as string) || req.file.originalname;
    const description = (req.body.description as string) || "";
    const tagsRaw = (req.body.tags as string) || "";
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const pdf = await createPdf(
      {
        title,
        pdfUrl: `/uploads/${req.file.filename}`,
        description,
        tags,
      },
      userId
    );

    res.status(201).json({ pdf });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, action, ...data } = req.body ?? {};
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");

    if (action === "favorite" || action === "toggleFavorite") {
      const pdf = await togglePdfFavorite(id, userId);
      if (!pdf) throw new HttpError(404, "PDF not found");
      res.json({ pdf });
      return;
    }

    const pdf = await updatePdf(id, data, userId);
    res.json({ pdf });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const id = req.query.id as string;
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");
    await deletePdf(id, userId);
    res.json({ success: true });
  })
);

export default router;
