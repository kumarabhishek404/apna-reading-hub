"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => Promise<void>;
  className?: string;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  className,
}: FavoriteButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={onToggle}
      aria-label={isFavorite ? "Remove from bookmarks" : "Add to bookmarks"}
    >
      <Star
        className={cn(
          "h-4 w-4",
          isFavorite ? "fill-brand-orange text-brand-orange" : "text-muted"
        )}
      />
    </Button>
  );
}
