import { Router } from "express";
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  toggleBlogFavorite,
  updateBlog,
} from "../services/blog.service";

const router = Router();

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || undefined;
  const tag = (req.query.tag as string) || undefined;
  const blogs = await getBlogs(search, tag);
  res.json({ blogs });
});

router.get("/:id", async (req, res) => {
  const blog = await getBlogById(req.params.id);
  if (!blog) return res.status(404).json({ error: "Blog not found" });
  res.json({ blog });
});

router.post("/", async (req, res) => {
  const blog = await createBlog(req.body);
  res.status(201).json({ blog });
});

router.patch("/", async (req, res) => {
  const { id, action, ...data } = req.body;
  if (!id) return res.status(400).json({ error: "ID required" });

  if (action === "favorite") {
    const blog = await toggleBlogFavorite(id);
    return res.json({ blog });
  }

  const blog = await updateBlog(id, data);
  res.json({ blog });
});

router.delete("/", async (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "ID required" });
  await deleteBlog(id);
  res.json({ success: true });
});

export default router;
