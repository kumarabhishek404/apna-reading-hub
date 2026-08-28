import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/copy-button";
import { TagList } from "@/components/shared/tag-list";
import { getLinkById } from "@/lib/server-data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await getLinkById(id);
  if (!link) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{link.title}</h1>
        <p className="mt-1 text-sm text-stone-500">{formatDate(link.createdAt)}</p>
      </div>
      {link.description && <p className="text-stone-600">{link.description}</p>}
      <p className="break-all text-sm text-stone-400">{link.url}</p>
      <TagList tags={link.tags} />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Open Link
          </a>
        </Button>
        <CopyButton text={link.url} />
        <Button variant="outline" asChild>
          <Link href={`/links/${link.id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>
    </div>
  );
}
