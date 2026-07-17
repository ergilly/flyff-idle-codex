import type { ItemMetadata } from "@/lib/api";
import { itemSetIndex } from "@/lib/generated/itemSetIndex";

export type ItemSetBonus = {
  equipped: number;
  ability: ItemMetadata["abilities"][number];
};

export type ItemSetMetadata = {
  id: number;
  name: string;
  parts: ReadonlyArray<{
    id: number;
    name: string;
  }>;
  bonus: ReadonlyArray<ItemSetBonus>;
};

const itemSetsById: Record<string, ItemSetMetadata> = itemSetIndex;
const itemSetByPartId = new Map<string, ItemSetMetadata>();

Object.values(itemSetsById).forEach((itemSet) => {
  itemSet.parts.forEach((part) => {
    itemSetByPartId.set(String(part.id), itemSet);
  });
});

export function findItemSetByPartId(itemId: string) {
  return itemSetByPartId.get(itemId) ?? null;
}
