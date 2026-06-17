import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadingLayoutProps {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
}

export function ReadingLayout({
  title,
  meta,
  children,
  backHref = "/",
}: ReadingLayoutProps) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20 space-y-4">
          <Button variant="ghost" size="sm" asChild className="w-full justify-start">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          {meta}
        </div>
      </aside>
      <article className="min-w-0 flex-1">
        <div className="mb-6 lg:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <header className="mb-8 border-b border-stone-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            {title}
          </h1>
          <div className="mt-4 lg:hidden">{meta}</div>
        </header>
        <div className="prose-reading mx-auto">{children}</div>
      </article>
    </div>
  );
}
