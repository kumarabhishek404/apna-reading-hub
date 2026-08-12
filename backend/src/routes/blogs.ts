import { Router } from "express";
import { requireAuth } from "../lib/auth";
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

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const tag = (req.query.tag as string) || undefined;
  const userId = (req as any).user?.userId;
  const blogs = await getBlogs(search, tag, userId);
  res.json({ blogs });
});

router.get("/:id", async (req, res) => {
  const userId = (req as any).user?.userId;
  const blog = await getBlogById(req.params.id, userId);
  if (!blog) return res.status(404).json({ error: "Blog not found" });
  res.json({ blog });
});

router.post("/", async (req, res) => {
  const userId = (req as any).user?.userId;
  const blog = await createBlog(req.body, userId);
  res.status(201).json({ blog });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite" || action === "toggleFavorite") {
    const blog = await toggleBlogFavorite(id, userId);
    return res.json({ blog });
  }

  const blog = await updateBlog(id, data, userId);
  res.json({ blog });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  const userId = (req as any).user?.userId;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteBlog(id, userId);
  res.json({ success: true });
});

export default router;
