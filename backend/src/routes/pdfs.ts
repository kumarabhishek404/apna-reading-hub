import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  createPdf,
  deletePdf,
  getPdfById,
  getPdfs,
  togglePdfFavorite,
  updatePdf,
} from "../services/pdf.service";

const router = Router();

const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(__dirname, "../../uploads");

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
  const pdfs = await getPdfs(search, tag);
  res.json({ pdfs });
});

router.get("/:id", async (req, res) => {
  const pdf = await getPdfById(req.params.id);
  if (!pdf) return res.status(404).json({ error: "PDF not found" });
  res.json({ pdf });
});

router.post("/", async (req, res) => {
  const pdf = await createPdf(req.body);
  res.status(201).json({ pdf });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "PDF file required" });
  }

  const title = (req.body.title as string) || req.file.originalname;
  const description = (req.body.description as string) || "";
  const tagsRaw = (req.body.tags as string) || "";

  const pdf = await createPdf({
    title,
    pdfUrl: `/uploads/${req.file.filename}`,
    description,
    tags: tagsRaw ? tagsRaw.split(",") : [],
  });

  res.status(201).json({ pdf });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite") {
    const pdf = await togglePdfFavorite(id);
    return res.json({ pdf });
  }

  const pdf = await updatePdf(id, data);
  res.json({ pdf });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deletePdf(id);
  res.json({ success: true });
});

export default router;
