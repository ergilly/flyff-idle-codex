import type { CharacterInventory, ItemMetadata } from "@/lib/api/types";
import type { ShopInventoryItem } from "@/lib/townShops";

export function toSellItem(
  stack: CharacterInventory["items"][number],
  itemsById: Record<string, ItemMetadata>
): ShopInventoryItem | undefined {
  const item = itemsById[stack.itemId];

  return item?.icon
    ? { ...item, icon: item.icon, maxStack: stack.quantity, price: item.sellPrice ?? 0 }
    : undefined;
}
