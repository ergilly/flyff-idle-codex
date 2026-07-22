import type { CharacterInventoryItem } from "@/lib/api";

export type QuestItemProgress = {
  current: number;
  isComplete: boolean;
  required: number;
};

export function getQuestItemProgress(
  inventoryItems: CharacterInventoryItem[],
  itemId: string,
  requiredCount: number
): QuestItemProgress {
  const required = Math.max(0, Math.floor(requiredCount));
  const owned = inventoryItems.reduce(
    (total, item) => (item.itemId === itemId ? total + Math.max(0, Math.floor(item.quantity)) : total),
    0
  );
  const current = Math.min(owned, required);

  return { current, isComplete: current >= required, required };
}
