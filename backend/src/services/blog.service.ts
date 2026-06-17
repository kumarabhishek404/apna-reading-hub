import { prisma } from "../lib/prisma";
import type { BlogItem } from "../lib/types";
import { upsertTags } from "./tag.service";

const blogInclude = {
  tags: { include: { tag: true } },
} as const;

function mapBlog(blog: {
  id: string;
  title: string;
  url: string | null;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: string; name: string } }[];
}): BlogItem {
  return {
    id: blog.id,
    title: blog.title,
    url: blog.url,
    content: blog.content,
    isFavorite: blog.isFavorite,
    createdAt: blog.createdAt.toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    tags: blog.tags.map((t) => t.tag),
  };
}

export async function getBlogs(search?: string, tag?: string) {
  const blogs = await prisma.blog.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search } },
                { content: { contains: search } },
                { url: { contains: search } },
              ],
            }
          : {},
        tag
          ? { tags: { some: { tag: { name: tag } } } }
          : {},
      ],
    },
    include: blogInclude,
    orderBy: { createdAt: "desc" },
  });
  return blogs.map(mapBlog);
}

export async function getBlogById(id: string) {
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: blogInclude,
  });
  return blog ? mapBlog(blog) : null;
}

export async function createBlog(data: {
  title: string;
  url?: string;
  content?: string;
  tags?: string[];
  isFavorite?: boolean;
}) {
  const tags = await upsertTags(data.tags ?? []);
  const blog = await prisma.blog.create({
    data: {
      title: data.title,
      url: data.url,
      content: data.content ?? "",
      isFavorite: data.isFavorite ?? false,
      tags: {
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
    },
    include: blogInclude,
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
  }
) {
  if (data.tags) {
    const tags = await upsertTags(data.tags);
    await prisma.blogTag.deleteMany({ where: { blogId: id } });
    await prisma.blogTag.createMany({
      data: tags.map((tag) => ({ blogId: id, tagId: tag.id })),
    });
  }

  const blog = await prisma.blog.update({
    where: { id },
    data: {
      title: data.title,
      url: data.url,
      content: data.content,
      isFavorite: data.isFavorite,
    },
    include: blogInclude,
  });
  return mapBlog(blog);
}

export async function deleteBlog(id: string) {
  await prisma.blog.delete({ where: { id } });
}

export async function toggleBlogFavorite(id: string) {
  const current = await prisma.blog.findUnique({ where: { id } });
  if (!current) return null;
  return updateBlog(id, { isFavorite: !current.isFavorite });
}
