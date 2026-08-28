import { Link } from "../models";
import type { LinkItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import { LIST_LIMIT, mapTags, ownedFilter, toIso } from "../lib/query";
import { upsertTags } from "./tag.service";

function mapLink(link: any): LinkItem {
  return {
    id: link._id.toString(),
    title: link.title,
    url: link.url,
    description: link.description,
    isFavorite: link.isFavorite,
    createdAt: toIso(link.createdAt),
    updatedAt: toIso(link.updatedAt),
    tags: mapTags(link.tags),
  };
}

export async function getLinks(search?: string, tag?: string, userId?: string) {
  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { url: { $regex: search, $options: "i" } },
    ];
  }

  const links = await Link.find(filter)
    .sort({ createdAt: -1 })
    .limit(LIST_LIMIT)
    .lean();

  return links.map(mapLink);
}

export async function getLinkById(id: string, userId?: string) {
  const link = await Link.findOne(ownedFilter(id, userId)).lean();
  if (!link) return null;
  return mapLink(link);
}

export async function createLink(
  data: {
    title: string;
    url: string;
    description?: string;
    tags?: string[];
    isFavorite?: boolean;
  },
  userId: string
) {
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
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.tags !== undefined) {
    const tags = await upsertTags(data.tags);
    updateData.tags = tags.map((tag) => tag.name);
  }

  const link = await Link.findOneAndUpdate(ownedFilter(id, userId), updateData, {
    new: true,
  }).lean();
  if (!link) throw new HttpError(404, "Link not found");
  return mapLink(link);
}

export async function deleteLink(id: string, userId?: string) {
  const result = await Link.findOneAndDelete(ownedFilter(id, userId)).lean();
  if (!result) throw new HttpError(404, "Link not found");
}

export async function toggleLinkFavorite(id: string, userId?: string) {
  const link = await Link.findOneAndUpdate(
    ownedFilter(id, userId),
    [{ $set: { isFavorite: { $eq: ["$isFavorite", false] } } }],
    { new: true }
  ).lean();
  if (!link) return null;
  return mapLink(link);
}
