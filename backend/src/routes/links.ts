import { Router } from "express";
import {
  createLink,
  deleteLink,
  getLinkById,
  getLinks,
  toggleLinkFavorite,
  updateLink,
} from "../services/link.service";

const router = Router();

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const tag = (req.query.tag as string) || undefined;
  const links = await getLinks(search, tag);
  res.json({ links });
});

router.get("/:id", async (req, res) => {
  const link = await getLinkById(req.params.id);
  if (!link) return res.status(404).json({ error: "Link not found" });
  res.json({ link });
});

router.post("/", async (req, res) => {
  const link = await createLink(req.body);
  res.status(201).json({ link });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite") {
    const link = await toggleLinkFavorite(id);
    return res.json({ link });
  }

  const link = await updateLink(id, data);
  res.json({ link });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteLink(id);
  res.json({ success: true });
});

export default router;
