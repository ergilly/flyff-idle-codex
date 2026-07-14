import { itemIndex, type ItemMetadata as GeneratedItemMetadata } from "../data/generated/itemIconIndex.js";
import { findDataRecord, type JsonDataRecord } from "../gameData/gameData.service.js";

export type ItemMetadata = GeneratedItemMetadata & {
  cooldown?: number | null;
  stack?: number | null;
  consumable?: boolean | null;
};

function getNumberField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "number" ? value : null;
}

function getBooleanField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "boolean" ? value : null;
}

function enrichItem(item: GeneratedItemMetadata): ItemMetadata {
  const itemData = findDataRecord("items", item.id);

  return {
    ...item,
    cooldown: getNumberField(itemData, "cooldown"),
    stack: getNumberField(itemData, "stack"),
    consumable: getBooleanField(itemData, "consumable")
  };
}

export function findItemsByIds(ids: string[]): ItemMetadata[] {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

  return uniqueIds.flatMap((id) => {
    const item = itemIndex[id];
    return item ? [enrichItem(item)] : [];
  });
}
