import { Router } from "express";
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

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const tag = (req.query.tag as string) || undefined;
  const notes = await getNotes(search, tag);
  res.json({ notes });
});

router.get("/:id", async (req, res) => {
  const note = await getNoteById(req.params.id);
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
  const note = await createNote(req.body);
  res.status(201).json({ note });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite") {
    const note = await toggleNoteFavorite(id);
    return res.json({ note });
  }

  if (action === "pin") {
    const note = await toggleNotePin(id);
    return res.json({ note });
  }

  const note = await updateNote(id, data);
  res.json({ note });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteNote(id);
  res.json({ success: true });
});

export default router;
