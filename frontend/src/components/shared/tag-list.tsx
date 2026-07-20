"use client";

import { Pin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PinButtonProps {
  isPinned: boolean;
  onToggle: () => Promise<void>;
  className?: string;
}

export function PinButton({ isPinned, onToggle, className }: PinButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={onToggle}
      aria-label={isPinned ? "Unpin note" : "Pin note"}
    >
      <Pin
        className={cn(
          "h-4 w-4",
          isPinned ? "fill-brand-orange text-brand-orange" : "text-muted"
        )}
      />
    </Button>
  );
}

export function TagList({ tags }: { tags: { id: string; name: string }[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tags?name=${encodeURIComponent(tag.name)}`}
          className="rounded-full bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
