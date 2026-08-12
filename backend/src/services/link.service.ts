import { Link, Tag } from "../models";
import type { LinkItem } from "../lib/types";
import { upsertTags } from "./tag.service";

function mapLink(link: any): LinkItem {
  return {
    id: link._id.toString(),
    title: link.title,
    url: link.url,
    description: link.description,
    isFavorite: link.isFavorite,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
    tags: link.tags.map((tagId: string) => ({ id: tagId, name: tagId })),
  };
}

export async function getLinks(search?: string, tag?: string, userId?: string) {
  const filter: any = {};
  
  if (userId) {
    filter.userId = userId;
  }
  
  if (tag) {
    filter.tags = tag;
  }
  
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { url: { $regex: search, $options: "i" } },
    ];
  }

  const links = await Link.find(filter)
    .sort({ createdAt: "desc" });
  
  return links.map(mapLink);
}

export async function getLinkById(id: string, userId?: string) {
  const link = await Link.findById(id);
  if (!link || (userId && link.userId.toString() !== userId)) return null;
  return mapLink(link);
}

export async function createLink(data: {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
}, userId: string) {
  const tags = await upsertTags(data.tags ?? []);
  const link = await Link.create({
    userId,
    title: data.title,
    url: data.url,
    description: data.description ?? "",
    isFavorite: data.isFavorite ?? false,
    tags: tags.map((tag) => tag.name),
  });
  return mapLink(link);
}

export async function updateLink(
  id: string,
  data: {
    title?: string;
    url?: string;
    description?: string;
    tags?: string[];
    isFavorite?: boolean;
  },
  userId?: string
) {
  const existing = await Link.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) throw new Error("Link not found");

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.tags !== undefined) {
    const tags = await upsertTags(data.tags);
    updateData.tags = tags.map((tag) => tag.name);
  }

  const link = await Link.findByIdAndUpdate(id, updateData, { new: true });
  return mapLink(link);
}

export async function deleteLink(id: string, userId?: string) {
  const existing = await Link.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) throw new Error("Link not found");
  await Link.findByIdAndDelete(id);
}

export async function toggleLinkFavorite(id: string, userId?: string) {
  const current = await Link.findById(id);
  if (!current || (userId && current.userId.toString() !== userId)) return null;
  return updateLink(id, { isFavorite: !current.isFavorite }, userId);
}
