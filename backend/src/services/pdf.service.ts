import { prisma } from "../lib/prisma";
import type { PdfItem } from "../lib/types";
import { upsertTags } from "./tag.service";

const pdfInclude = {
  tags: { include: { tag: true } },
} as const;

function mapPdf(pdf: {
  id: string;
  title: string;
  pdfUrl: string;
  description: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: string; name: string } }[];
}): PdfItem {
  return {
    id: pdf.id,
    title: pdf.title,
    pdfUrl: pdf.pdfUrl,
    description: pdf.description,
    isFavorite: pdf.isFavorite,
    createdAt: pdf.createdAt.toISOString(),
    updatedAt: pdf.updatedAt.toISOString(),
    tags: pdf.tags.map((t) => t.tag),
  };
}

export async function getPdfs(search?: string, tag?: string) {
  const pdfs = await prisma.pdf.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
      ],
    },
    include: pdfInclude,
    orderBy: { createdAt: "desc" },
  });
  return pdfs.map(mapPdf);
}

export async function getPdfById(id: string) {
  const pdf = await prisma.pdf.findUnique({
    where: { id },
    include: pdfInclude,
  });
  return pdf ? mapPdf(pdf) : null;
}

export async function createPdf(data: {
  title: string;
  pdfUrl: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
}) {
  const tags = await upsertTags(data.tags ?? []);
  const pdf = await prisma.pdf.create({
    data: {
      title: data.title,
      pdfUrl: data.pdfUrl,
      description: data.description ?? "",
      isFavorite: data.isFavorite ?? false,
      tags: {
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
    },
    include: pdfInclude,
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
  }
) {
  if (data.tags) {
    const tags = await upsertTags(data.tags);
    await prisma.pdfTag.deleteMany({ where: { pdfId: id } });
    await prisma.pdfTag.createMany({
      data: tags.map((tag) => ({ pdfId: id, tagId: tag.id })),
    });
  }

  const pdf = await prisma.pdf.update({
    where: { id },
    data: {
      title: data.title,
      pdfUrl: data.pdfUrl,
      description: data.description,
      isFavorite: data.isFavorite,
    },
    include: pdfInclude,
  });
  return mapPdf(pdf);
}

export async function deletePdf(id: string) {
  await prisma.pdf.delete({ where: { id } });
}

export async function togglePdfFavorite(id: string) {
  const current = await prisma.pdf.findUnique({ where: { id } });
  if (!current) return null;
  return updatePdf(id, { isFavorite: !current.isFavorite });
}
