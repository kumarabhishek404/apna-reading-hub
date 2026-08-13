import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../lib/auth";
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
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const tag = (req.query.tag as string) || undefined;
  const userId = (req as any).user?.userId;
  const pdfs = await getPdfs(search, tag, userId);
  res.json({ pdfs });
});

router.get("/:id", async (req, res) => {
  const userId = (req as any).user?.userId;
  const pdf = await getPdfById(req.params.id, userId);
  if (!pdf) return res.status(404).json({ error: "PDF not found" });
  res.json({ pdf });
});

router.post("/", async (req, res) => {
  const userId = (req as any).user?.userId;
  const pdf = await createPdf(req.body, userId);
  res.status(201).json({ pdf });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const userId = (req as any).user?.userId;
  console.log('[PDF Upload] Starting upload', { userId, hasFile: !!req.file });
  
  if (!req.file) {
    console.log('[PDF Upload] No file provided');
    return res.status(400).json({ error: "PDF file required" });
  }

  console.log('[PDF Upload] File received', {
    originalName: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });

  const title = (req.body.title as string) || req.file.originalname;
  const description = (req.body.description as string) || "";
  const tagsRaw = (req.body.tags as string) || "";

  console.log('[PDF Upload] Metadata', { title, description, tagsRaw });

  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  console.log('[PDF Upload] Parsed tags', tags);

  const pdf = await createPdf({
    title,
    pdfUrl: `/uploads/${req.file.filename}`,
    description,
    tags,
  }, userId);

  console.log('[PDF Upload] PDF created', { id: (pdf as any)._id.toString() });
  res.status(201).json({ pdf });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite" || action === "toggleFavorite") {
    const pdf = await togglePdfFavorite(id, userId);
    return res.json({ pdf });
  }

  const pdf = await updatePdf(id, data, userId);
  res.json({ pdf });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deletePdf(id, userId);
  res.json({ success: true });
});

export default router;
