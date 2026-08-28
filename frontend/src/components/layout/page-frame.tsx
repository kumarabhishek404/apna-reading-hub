import { cn } from "@/lib/utils";

/** Shared content column for the header and every signed-in page. */
export const PAGE_FRAME_CLASS = "page-frame";

export function PageFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_FRAME_CLASS, className)}>{children}</div>;
}
