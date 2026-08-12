import { Router } from "express";
import { requireAuth } from "../lib/auth";
import {
  createLink,
  deleteLink,
  getLinkById,
  getLinks,
  toggleLinkFavorite,
  updateLink,
} from "../services/link.service";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const tag = (req.query.tag as string) || undefined;
  const userId = (req as any).user?.userId;
  const links = await getLinks(search, tag, userId);
  res.json({ links });
});

router.get("/:id", async (req, res) => {
  const userId = (req as any).user?.userId;
  const link = await getLinkById(req.params.id, userId);
  if (!link) return res.status(404).json({ error: "Link not found" });
  res.json({ link });
});

router.post("/", async (req, res) => {
  const userId = (req as any).user?.userId;
  const link = await createLink(req.body, userId);
  res.status(201).json({ link });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite" || action === "toggleFavorite") {
    const link = await toggleLinkFavorite(id, userId);
    return res.json({ link });
  }

  const link = await updateLink(id, data, userId);
  res.json({ link });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteLink(id, userId);
  res.json({ success: true });
});

export default router;
