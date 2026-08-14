import { Pdf } from "../models";
import type { PdfItem } from "../lib/types";
import { HttpError } from "../lib/errors";
import { LIST_LIMIT, mapTags, toIso } from "../lib/query";
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
  const pdf = await Pdf.findById(id).lean();
  if (!pdf || (userId && pdf.userId.toString() !== userId)) return null;
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
  const existing = await Pdf.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) {
    throw new HttpError(404, "PDF not found");
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.pdfUrl !== undefined) updateData.pdfUrl = data.pdfUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
  if (data.tags !== undefined) {
    const tags = await upsertTags(data.tags);
    updateData.tags = tags.map((tag) => tag.name);
  }

  const pdf = await Pdf.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return mapPdf(pdf);
}

export async function deletePdf(id: string, userId?: string) {
  const existing = await Pdf.findById(id);
  if (!existing || (userId && existing.userId.toString() !== userId)) {
    throw new HttpError(404, "PDF not found");
  }
  await Pdf.findByIdAndDelete(id);
}

export async function togglePdfFavorite(id: string, userId?: string) {
  const current = await Pdf.findById(id);
  if (!current || (userId && current.userId.toString() !== userId)) return null;
  return updatePdf(id, { isFavorite: !current.isFavorite }, userId);
}
