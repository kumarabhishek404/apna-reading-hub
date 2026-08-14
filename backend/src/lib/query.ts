/** Shared list query defaults for content services. */
export const LIST_LIMIT = 500;

export function toIso(value: Date | string | undefined | null): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export function mapTags(tags: string[] | undefined) {
  return (tags || []).map((name) => ({ id: name, name }));
}
