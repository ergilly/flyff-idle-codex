export type QuestItemRequirementEntry = { count: number; item: number };

export function normalizeQuestItemRequirements(
  entries: QuestItemRequirementEntry[] | undefined
): QuestItemRequirementEntry[] {
  const countByItem = new Map<number, number>();

  for (const entry of entries ?? []) {
    if (!Number.isInteger(entry.item) || !Number.isFinite(entry.count) || entry.count <= 0) continue;
    const count = Math.floor(entry.count);
    countByItem.set(entry.item, Math.max(countByItem.get(entry.item) ?? 0, count));
  }

  return Array.from(countByItem, ([item, count]) => ({ count, item }));
}
