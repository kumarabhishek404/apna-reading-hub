import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/errors";
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  toggleBlogFavorite,
  updateBlog,
} from "../services/blog.service";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string) || undefined;
    const tag = (req.query.tag as string) || undefined;
    const userId = (req as any).user?.userId as string;
    const blogs = await getBlogs(search, tag, userId);
    res.json({ blogs });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    const blog = await getBlogById(req.params.id, userId);
    if (!blog) throw new HttpError(404, "Blog not found");
    res.json({ blog });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.userId as string;
    if (!req.body?.title?.trim()) throw new HttpError(400, "Title is required");
    const blog = await createBlog(req.body, userId);
    res.status(201).json({ blog });
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const { id, action, ...data } = req.body ?? {};
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");

    if (action === "favorite" || action === "toggleFavorite") {
      const blog = await toggleBlogFavorite(id, userId);
      if (!blog) throw new HttpError(404, "Blog not found");
      res.json({ blog });
      return;
    }

    const blog = await updateBlog(id, data, userId);
    res.json({ blog });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const id = req.query.id as string;
    const userId = (req as any).user?.userId as string;
    if (!id) throw new HttpError(400, "ID required");
    await deleteBlog(id, userId);
    res.json({ success: true });
  })
);

export default router;
