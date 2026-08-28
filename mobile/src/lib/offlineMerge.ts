export function isLocalEntityId(id: string, entityType: string) {
  return id.startsWith(`${entityType}_`);
}

export function mergeServerAndLocal<T extends { id: string }>(
  serverItems: T[],
  localItems: T[],
  entityType: string,
): T[] {
  const serverIds = new Set(serverItems.map((item) => item.id));
  const pending = localItems.filter(
    (item) => isLocalEntityId(item.id, entityType) && !serverIds.has(item.id),
  );
  return [...pending, ...serverItems];
}
