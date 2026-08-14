import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
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
import { HttpError } from "../lib/errors";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || undefined;
    const tag = (req.query.tag as string) || undefined;
    const userId = (req as any).user?.userId as string;
    const notes = await getNotes(search, tag, userId);
    res.json({ notes });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    const note = await getNoteById(req.params.id, userId);
    if (!note) throw new HttpError(404, "Note not found");

    if (req.query.format === "markdown") {
      const markdown = exportNoteAsMarkdown(note);
      const filename = `${note.title.replace(/[^a-z0-9]/gi, "_")}.md`;
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(markdown);
      return;
    }

    res.json({ note });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    if (!req.body?.title?.trim()) throw new HttpError(400, "Title is required");
    const note = await createNote(req.body, userId);
    res.status(201).json({ note });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, action, ...data } = req.body ?? {};
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");

    if (action === "favorite" || action === "toggleFavorite") {
      const note = await toggleNoteFavorite(id, userId);
      if (!note) throw new HttpError(404, "Note not found");
      res.json({ note });
      return;
    }

    if (action === "pin" || action === "togglePin") {
      const note = await toggleNotePin(id, userId);
      if (!note) throw new HttpError(404, "Note not found");
      res.json({ note });
      return;
    }

    const note = await updateNote(id, data, userId);
    res.json({ note });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const id = req.query.id as string;
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");
    await deleteNote(id, userId);
    res.json({ success: true });
  })
);

export default router;
