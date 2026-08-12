import { Router } from "express";
import { requireAuth } from "../lib/auth";
import {
  createNote,
  deleteNote,
  exportNoteAsMarkdown,
  getNoteById,
  getNotes,
  toggleNoteFavorite,
  toggleNotePin,
  updateNote,
} from "../services/note.service";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const tag = (req.query.tag as string) || undefined;
  const userId = (req as any).user?.userId;
  const notes = await getNotes(search, tag, userId);
  res.json({ notes });
});

router.get("/:id", async (req, res) => {
  const userId = (req as any).user?.userId;
  const note = await getNoteById(req.params.id, userId);
  if (!note) return res.status(404).json({ error: "Note not found" });

  if (req.query.format === "markdown") {
    const markdown = exportNoteAsMarkdown(note);
    const filename = `${note.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(markdown);
  }

  res.json({ note });
});

router.post("/", async (req, res) => {
  const userId = (req as any).user?.userId;
  const note = await createNote(req.body, userId);
  res.status(201).json({ note });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite") {
    const note = await toggleNoteFavorite(id, userId);
    return res.json({ note });
  }

  if (action === "pin") {
    const note = await toggleNotePin(id, userId);
    return res.json({ note });
  }

  const note = await updateNote(id, data, userId);
  res.json({ note });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteNote(id, userId);
  res.json({ success: true });
});

export default router;
