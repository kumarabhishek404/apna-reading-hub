import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReadingLayout } from "@/components/layout/reading-layout";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { TagList } from "@/components/shared/tag-list";
import { CopyButton } from "@/components/shared/copy-button";
import { apiUrl } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { BlogItem } from "@/lib/types";

async function getBlog(id: string): Promise<BlogItem | null> {
  const res = await fetch(apiUrl(`/api/blogs/${id}`), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.blog;
}

export default async function BlogReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blog = await getBlog(id);
  if (!blog) notFound();

  return (
    <ReadingLayout
      title={blog.title}
      meta={
        <div className="space-y-3">
          <p className="text-sm text-stone-500">{formatDate(blog.createdAt)}</p>
          <TagList tags={blog.tags} />
          <div className="flex flex-wrap gap-2">
            {blog.url && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={blog.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open Original
                  </a>
                </Button>
                <CopyButton text={blog.url} label="Copy Link" />
              </>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/blogs/${blog.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      }
    >
      {blog.content ? (
        <MarkdownViewer content={blog.content} />
      ) : (
        <p className="text-stone-500">No content added yet.</p>
      )}
    </ReadingLayout>
  );
}
