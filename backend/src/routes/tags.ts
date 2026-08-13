import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
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
    const userId = (req as any).user?.userId;
    console.log('[Tags Route] Getting content by tag', { tagName: req.params.tagName, userId });
    const content = await getContentByTag(req.params.tagName, userId);
    console.log('[Tags Route] Content retrieved', { total: content.total });
    res.json(content);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    console.log('[Tags Route] Creating tag', { name });
    if (!name) {
      console.log('[Tags Route] Validation failed: name required');
      return res.status(400).json({ error: "Tag name is required" });
    }
    const tag = await createTag(name);
    console.log('[Tags Route] Tag created successfully', { id: tag._id.toString() });
    res.status(201).json({ tag });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, name } = req.body;
    console.log('[Tags Route] Updating tag', { id, name });
    if (!id || !name) {
      console.log('[Tags Route] Validation failed: id and name required');
      return res.status(400).json({ error: "ID and name are required" });
    }
    const tag = await updateTag(id, name);
    if (!tag) {
      console.log('[Tags Route] Tag not found', { id });
      return res.status(404).json({ error: "Tag not found" });
    }
    console.log('[Tags Route] Tag updated successfully');
    res.json({ tag });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { id } = req.query;
    console.log('[Tags Route] Deleting tag', { id });
    if (!id) {
      console.log('[Tags Route] Validation failed: id required');
      return res.status(400).json({ error: "ID is required" });
    }
    await deleteTag(id as string);
    console.log('[Tags Route] Tag deleted successfully');
    res.json({ success: true });
  })
);

export default router;
