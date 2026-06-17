import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function parseTags(input: string | string[]): string[] {
  const raw = Array.isArray(input) ? input : input.split(",");
  return [...new Set(raw.map((t) => t.trim()).filter(Boolean))];
}

export function slugifyTag(name: string) {
  return encodeURIComponent(name);
}
