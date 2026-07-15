import { type Character, type ItemMetadata } from "@/lib/api";
import {
  type ConsumableCooldownState,
  type ConsumableResource,
  type RecoveryInventoryItem
} from "@/lib/battle/types";

export const emptyConsumableLoadout: NonNullable<Character["consumableLoadout"]> = {
  fp: null,
  hp: null,
  mp: null
};

export const emptyConsumableCooldowns: ConsumableCooldownState = {
  fp: 0,
  hp: 0,
  mp: 0
};

export function clampResourceValue(value: number | null | undefined, max: number) {
  return Math.max(0, Math.min(value ?? max, max));
}

function isRecoveryCategory(item: ItemMetadata) {
  return (item.category ?? "").toLowerCase().startsWith("recovery");
}

export function getRecoveryAbility(item: ItemMetadata, resource: ConsumableResource) {
  return item.abilities.find((ability) => ability.parameter.toLowerCase() === resource) ?? null;
}

export function getConsumableCooldownMs(item: ItemMetadata) {
  return item.cooldown && item.cooldown > 0 ? item.cooldown * 1000 : 0;
}

export function getRecoveryInventoryItems(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  resource: ConsumableResource
): RecoveryInventoryItem[] {
  return character.inventory.items
    .flatMap((inventoryItem) => {
      const item = itemsById[inventoryItem.itemId];

      if (!item || !isRecoveryCategory(item)) {
        return [];
      }

      const ability = getRecoveryAbility(item, resource);

      return ability ? [{ inventoryItem, item, recoverAmount: ability.add }] : [];
    })
    .sort((left, right) => {
      const recoverDifference = (right.recoverAmount ?? 0) - (left.recoverAmount ?? 0);

      return recoverDifference !== 0
        ? recoverDifference
        : left.item.name.localeCompare(right.item.name, undefined, { sensitivity: "base" });
    });
}
