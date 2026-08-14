import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/errors";
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

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || undefined;
    const tag = (req.query.tag as string) || undefined;
    const userId = (req as any).user?.userId as string;
    const links = await getLinks(search, tag, userId);
    res.json({ links });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    const link = await getLinkById(req.params.id, userId);
    if (!link) throw new HttpError(404, "Link not found");
    res.json({ link });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    if (!req.body?.title?.trim()) throw new HttpError(400, "Title is required");
    if (!req.body?.url?.trim()) throw new HttpError(400, "URL is required");
    const link = await createLink(req.body, userId);
    res.status(201).json({ link });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, action, ...data } = req.body ?? {};
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");

    if (action === "favorite" || action === "toggleFavorite") {
      const link = await toggleLinkFavorite(id, userId);
      if (!link) throw new HttpError(404, "Link not found");
      res.json({ link });
      return;
    }

    const link = await updateLink(id, data, userId);
    res.json({ link });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const id = req.query.id as string;
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");
    await deleteLink(id, userId);
    res.json({ success: true });
  })
);

export default router;
