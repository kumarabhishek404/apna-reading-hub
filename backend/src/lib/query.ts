/** Shared list query defaults for content services. */
export const LIST_LIMIT = 250;

/** Truncate long text in list payloads so board fetches stay small. */
export const LIST_CONTENT_CHARS = 600;
export const LIST_BLOCK_CHARS = 280;

export function toIso(value: Date | string | undefined | null): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export function mapTags(tags: string[] | undefined) {
  return (tags || []).map((name) => ({ id: name, name }));
}

export function ownedFilter(id: string, userId?: string) {
  return userId ? { _id: id, userId } : { _id: id };
}

export function clipText(value: string | null | undefined, max: number) {
  if (!value) return value ?? "";
  if (value.length <= max) return value;
  return value.slice(0, max);
}
