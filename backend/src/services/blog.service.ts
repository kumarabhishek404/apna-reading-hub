import { Blog } from "../models";
import type { BlogItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import { LIST_LIMIT, mapTags, ownedFilter, toIso } from "../lib/query";
import { upsertTags } from "./tag.service";

function mapBlog(blog: any): BlogItem {
  return {
    id: blog._id.toString(),
    title: blog.title,
    url: blog.url,
    content: blog.content,
    isFavorite: blog.isFavorite,
    createdAt: toIso(blog.createdAt),
    updatedAt: toIso(blog.updatedAt),
    tags: mapTags(blog.tags),
  };
}

export async function getBlogs(search?: string, tag?: string, userId?: string) {
  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };

  const blogs = await Blog.find(filter)
    .sort({ createdAt: -1 })
    .limit(LIST_LIMIT)
    .lean();

  return blogs.map(mapBlog);
}

export async function getBlogById(id: string, userId?: string) {
  const blog = await Blog.findOne(ownedFilter(id, userId)).lean();
  if (!blog) return null;
  return mapBlog(blog);
}

export async function createBlog(
  data: {
    title: string;
    url?: string;
    content?: string;
    tags?: string[];
    isFavorite?: boolean;
  },
  userId: string
) {
  const tags = await upsertTags(data.tags ?? []);
  const blog = await Blog.create({
    userId,
    title: data.title,
    url: data.url,
    content: data.content ?? "",
    isFavorite: data.isFavorite ?? false,
    tags: tags.map((tag) => tag.name),
  });
  return mapBlog(blog);
}

export async function updateBlog(
  id: string,
  data: {
    title?: string;
    url?: string;
    content?: string;
    tags?: string[];
    isFavorite?: boolean;
  },
  userId?: string
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.tags !== undefined) {
    const tags = await upsertTags(data.tags);
    updateData.tags = tags.map((tag) => tag.name);
  }

  const blog = await Blog.findOneAndUpdate(ownedFilter(id, userId), updateData, {
    new: true,
  }).lean();
  if (!blog) throw new HttpError(404, "Blog not found");
  return mapBlog(blog);
}

export async function deleteBlog(id: string, userId?: string) {
  const result = await Blog.findOneAndDelete(ownedFilter(id, userId)).lean();
  if (!result) throw new HttpError(404, "Blog not found");
}

export async function toggleBlogFavorite(id: string, userId?: string) {
  const blog = await Blog.findOneAndUpdate(
    ownedFilter(id, userId),
    [{ $set: { isFavorite: { $eq: ["$isFavorite", false] } } }],
    { new: true }
  ).lean();
  if (!blog) return null;
  return mapBlog(blog);
}
