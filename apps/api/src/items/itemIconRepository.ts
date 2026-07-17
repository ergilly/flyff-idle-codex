import { itemIndex, type ItemMetadata as GeneratedItemMetadata } from "../data/generated/itemIconIndex.js";
import { addFlyingItemProgressionDescription } from "../data/flyingItemProgression.js";
import { findDataRecord, type JsonDataRecord } from "../gameData/gameData.service.js";

export type ItemMetadata = GeneratedItemMetadata & {
  buyPrice?: number | null;
  cooldown?: number | null;
  stack?: number | null;
  consumable?: boolean | null;
  sellPrice?: number | null;
  tradable?: boolean | null;
};

function getNumberField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "number" ? value : null;
}

function getBooleanField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "boolean" ? value : null;
}

function getStringField(item: JsonDataRecord | undefined, field: string) {
  const value = item?.[field];

  return typeof value === "string" && value.toLowerCase() !== "null" ? value : null;
}

function getNullableStringField(item: JsonDataRecord | undefined, field: string, fallback: string | null) {
  if (!item || !(field in item)) return fallback;
  return getStringField(item, field);
}

function enrichItem(item: GeneratedItemMetadata): ItemMetadata {
  const itemData = findDataRecord("items", item.id);
  const gameDataDescription = getNullableStringField(itemData, "description", item.description);

  return {
    ...item,
    name: getStringField(itemData, "name") ?? item.name,
    description: addFlyingItemProgressionDescription(item.id, gameDataDescription),
    icon: getStringField(itemData, "icon") ?? item.icon,
    category: getStringField(itemData, "category") ?? item.category,
    subcategory: getStringField(itemData, "subcategory") ?? item.subcategory,
    rarity: getStringField(itemData, "rarity") ?? item.rarity,
    level: getNumberField(itemData, "level") ?? item.level,
    sex: getStringField(itemData, "sex") ?? item.sex,
    minAttack: getNumberField(itemData, "minAttack") ?? item.minAttack,
    maxAttack: getNumberField(itemData, "maxAttack") ?? item.maxAttack,
    attackSpeed: getStringField(itemData, "attackSpeed") ?? item.attackSpeed,
    twoHanded: getBooleanField(itemData, "twoHanded") ?? item.twoHanded,
    minDefense: getNumberField(itemData, "minDefense") ?? item.minDefense,
    maxDefense: getNumberField(itemData, "maxDefense") ?? item.maxDefense,
    buyPrice: getNumberField(itemData, "buyPrice"),
    cooldown: getNumberField(itemData, "cooldown"),
    stack: getNumberField(itemData, "stack"),
    consumable: getBooleanField(itemData, "consumable"),
    sellPrice: getNumberField(itemData, "sellPrice"),
    tradable: getBooleanField(itemData, "tradable")
  };
}

export function findItemsByIds(ids: string[]): ItemMetadata[] {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

  return uniqueIds.flatMap((id) => {
    const item = itemIndex[id];
    return item ? [enrichItem(item)] : [];
  });
}
