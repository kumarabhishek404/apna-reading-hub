import { Pdf } from "../models";
import type { PdfItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import { LIST_LIMIT, mapTags, ownedFilter, toIso } from "../lib/query";
import { upsertTags } from "./tag.service";

function mapPdf(pdf: any): PdfItem {
  return {
    id: pdf._id.toString(),
    title: pdf.title,
    pdfUrl: pdf.pdfUrl,
    description: pdf.description,
    isFavorite: pdf.isFavorite,
    createdAt: toIso(pdf.createdAt),
    updatedAt: toIso(pdf.updatedAt),
    tags: mapTags(pdf.tags),
  };
}

export async function getPdfs(search?: string, tag?: string, userId?: string) {
  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const pdfs = await Pdf.find(filter)
    .sort({ createdAt: -1 })
    .limit(LIST_LIMIT)
    .lean();

  return pdfs.map(mapPdf);
}

export async function getPdfById(id: string, userId?: string) {
  const pdf = await Pdf.findOne(ownedFilter(id, userId)).lean();
  if (!pdf) return null;
  return mapPdf(pdf);
}

export async function createPdf(
  data: {
    title: string;
    pdfUrl: string;
    description?: string;
    tags?: string[];
    isFavorite?: boolean;
  },
  userId: string
) {
  const tags = await upsertTags(data.tags ?? []);
  const pdf = await Pdf.create({
    userId,
    title: data.title,
    pdfUrl: data.pdfUrl,
    description: data.description ?? "",
    isFavorite: data.isFavorite ?? false,
    tags: tags.map((tag) => tag.name),
  });
  return mapPdf(pdf);
}

export async function updatePdf(
  id: string,
  data: {
    title?: string;
    pdfUrl?: string;
    description?: string;
    tags?: string[];
    isFavorite?: boolean;
  },
  userId?: string
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.pdfUrl !== undefined) updateData.pdfUrl = data.pdfUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.tags !== undefined) {
    const tags = await upsertTags(data.tags);
    updateData.tags = tags.map((tag) => tag.name);
  }

  const pdf = await Pdf.findOneAndUpdate(ownedFilter(id, userId), updateData, {
    new: true,
  }).lean();
  if (!pdf) throw new HttpError(404, "PDF not found");
  return mapPdf(pdf);
}

export async function deletePdf(id: string, userId?: string) {
  const result = await Pdf.findOneAndDelete(ownedFilter(id, userId)).lean();
  if (!result) throw new HttpError(404, "PDF not found");
}

export async function togglePdfFavorite(id: string, userId?: string) {
  const pdf = await Pdf.findOneAndUpdate(
    ownedFilter(id, userId),
    [{ $set: { isFavorite: { $eq: ["$isFavorite", false] } } }],
    { new: true }
  ).lean();
  if (!pdf) return null;
  return mapPdf(pdf);
}
