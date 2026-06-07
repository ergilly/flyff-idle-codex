import { itemIndex, type ItemMetadata } from "../data/generated/itemIconIndex.js";

export function findItemsByIds(ids: string[]): ItemMetadata[] {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

  return uniqueIds.flatMap((id) => {
    const item = itemIndex[id];
    return item ? [item] : [];
  });
}
