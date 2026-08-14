import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/errors";
import {
  createTag,
  updateTag,
  deleteTag,
  getContentByTag,
} from "../services/tag.service";

const router = Router();
router.use(requireAuth);

router.get(
  "/:tagName/content",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    const content = await getContentByTag(req.params.tagName, userId);
    res.json(content);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name } = req.body ?? {};
    if (!name) throw new HttpError(400, "Tag name is required");
    const tag = await createTag(name);
    res.status(201).json({ tag });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, name } = req.body ?? {};
    if (!id || !name) throw new HttpError(400, "ID and name are required");
    const tag = await updateTag(id, name);
    res.json({ tag });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const id = req.query.id as string;
    if (!id) throw new HttpError(400, "ID is required");
    await deleteTag(id);
    res.json({ success: true });
  })
);

export default router;
