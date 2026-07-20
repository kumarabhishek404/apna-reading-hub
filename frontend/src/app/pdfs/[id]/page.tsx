import { notFound } from "next/navigation";
import { TagList } from "@/components/shared/tag-list";
import { assetUrl } from "@/lib/api";
import { getPdfById } from "@/lib/server-data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PdfViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pdf = await getPdfById(id);
  if (!pdf) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{pdf.title}</h1>
        <p className="mt-1 text-sm text-stone-500">{formatDate(pdf.createdAt)}</p>
        {pdf.description && (
          <p className="mt-2 text-stone-600">{pdf.description}</p>
        )}
        <div className="mt-3">
          <TagList tags={pdf.tags} />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <iframe
          src={assetUrl(pdf.pdfUrl)}
          title={pdf.title}
          className="h-[80vh] w-full"
        />
      </div>
    </div>
  );
}
