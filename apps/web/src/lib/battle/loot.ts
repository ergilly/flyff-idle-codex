import { type ItemMetadata, type MonsterFamilyVariant } from "@/lib/api";
import { type BattleDroppedItem } from "@/lib/battle/types";

export { isQuestDropItem } from "@/lib/itemClassification";

const rarityTextClassByName: Record<string, string> = {
  common: "text-[#5fb3ff]",
  uncommon: "text-[#64d875]",
  rare: "text-[#f5d451]",
  veryrare: "text-[#ff6464]",
  unique: "text-[#c27bff]"
};

const rarityBorderClassByName: Record<string, string> = {
  common: "border-[#5fb3ff]/45",
  uncommon: "border-[#64d875]/50",
  rare: "border-[#f5d451]/55",
  veryrare: "border-[#ff6464]/55",
  unique: "border-[#c27bff]/55"
};

export const dropCategoryOrder = [
  "weapon",
  "armor",
  "jewelry",
  "upgradeMaterial",
  "consumable",
  "fashion",
  "flying",
  "other"
] as const;

export const dropCategoryLabels: Record<(typeof dropCategoryOrder)[number], string> = {
  armor: "Armor",
  consumable: "Consumables",
  fashion: "Fashion",
  flying: "Flying",
  jewelry: "Jewelry",
  other: "Other",
  upgradeMaterial: "Upgrade Materials",
  weapon: "Weapons"
};

export function formatBattleValue(value: number | string | null | undefined) {
  return value === null || value === undefined ? "Unknown" : String(value);
}

export function getDropRarityTextClass(rarity: string | null | undefined) {
  return rarityTextClassByName[rarity?.toLowerCase() ?? "common"] ?? rarityTextClassByName.common;
}

export function getDropRarityBorderClass(rarity: string | null | undefined) {
  return rarityBorderClassByName[rarity?.toLowerCase() ?? "common"] ?? rarityBorderClassByName.common;
}

function getDropChancePercent(drop: { probabilityRange?: string; prob?: string }) {
  const chanceText = drop.probabilityRange ?? drop.prob ?? "";
  const chanceValues = Array.from(chanceText.matchAll(/\d+(?:\.\d+)?/g)).map((match) => Number(match[0]));

  if (chanceValues.length === 0) {
    return 0;
  }

  const chance = Math.max(...chanceValues);

  return chanceText.includes("%") || chance > 1 ? chance : chance * 100;
}

export function rollMonsterDrops(
  drops: MonsterFamilyVariant["drops"] | undefined,
  random: () => number = Math.random
): BattleDroppedItem[] {
  return (drops ?? []).flatMap((drop) => {
    const chancePercent = getDropChancePercent(drop);

    return chancePercent > 0 && random() * 100 < chancePercent
      ? [{ itemId: String(drop.item), quantity: 1 }]
      : [];
  });
}

export function addDroppedItems(currentDrops: BattleDroppedItem[], nextDrops: BattleDroppedItem[]) {
  if (nextDrops.length === 0) {
    return currentDrops;
  }

  const dropsByItemId = new Map(currentDrops.map((drop) => [drop.itemId, { ...drop }]));

  nextDrops.forEach((drop) => {
    const existingDrop = dropsByItemId.get(drop.itemId);

    if (existingDrop) {
      existingDrop.quantity += drop.quantity;
    } else {
      dropsByItemId.set(drop.itemId, { ...drop });
    }
  });

  return Array.from(dropsByItemId.values());
}

export function removeDroppedItems(currentDrops: BattleDroppedItem[], removedDrops: BattleDroppedItem[]) {
  const removedQuantityByItemId = new Map(removedDrops.map((drop) => [drop.itemId, drop.quantity]));

  return currentDrops.flatMap((drop) => {
    const nextQuantity = drop.quantity - (removedQuantityByItemId.get(drop.itemId) ?? 0);

    return nextQuantity > 0 ? [{ ...drop, quantity: nextQuantity }] : [];
  });
}

export function rollMonsterPenya(monster: MonsterFamilyVariant, random: () => number = Math.random) {
  const minDropGold = Math.max(0, Math.floor(monster.minDropGold ?? 0));
  const maxDropGold = Math.max(minDropGold, Math.floor(monster.maxDropGold ?? minDropGold));

  return minDropGold + Math.floor(random() * (maxDropGold - minDropGold + 1));
}

export function getDropCategory(item: ItemMetadata | undefined): (typeof dropCategoryOrder)[number] {
  const category = item?.category?.toLowerCase() ?? "";
  const subcategory = item?.subcategory?.toLowerCase() ?? "";

  if (item?.consumable) return "consumable";
  if (category === "weapon") return "weapon";
  if (category === "armor") return "armor";
  if (["accessory", "jewelry", "jewelery"].includes(category)) return "jewelry";

  if (
    ["upgrade", "material", "materials"].includes(category) ||
    ["upgrade", "material", "sunstone", "moonstone"].some((term) => subcategory.includes(term))
  ) {
    return "upgradeMaterial";
  }

  const consumableTerms = [
    "food",
    "potion",
    "potions",
    "recovery",
    "refresher",
    "refreshers",
    "pill",
    "pills",
    "scroll",
    "scrolls",
    "consumable",
    "consumables"
  ];

  if (consumableTerms.includes(category) || consumableTerms.some((term) => subcategory.includes(term))) {
    return "consumable";
  }

  if (category === "fashion") return "fashion";
  if (category === "flying") return "flying";
  return "other";
}
