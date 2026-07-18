import { type FocusEvent, type MouseEvent } from "react";
import { ShopInventorySlot } from "@/components/molecules/map/ShopInventorySlot";
import type { CharacterInventory, ItemMetadata } from "@/lib/api/types";
import { toSellItem } from "@/lib/shopInventory";
import type { ShopInventoryItem } from "@/lib/townShops";

export function BankInventoryGrid({
  inventory,
  itemsById,
  label,
  onHideDetails,
  onInspect,
  onSelect,
  selectedSlotIndex
}: {
  inventory: CharacterInventory;
  itemsById: Record<string, ItemMetadata>;
  label: string;
  onHideDetails: () => void;
  onInspect: (
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: ShopInventoryItem
  ) => void;
  onSelect: (slotIndex: number) => void;
  selectedSlotIndex: number | null;
}) {
  return (
    <div
      aria-label={label}
      className="themed-scrollbar grid h-[220px] min-w-0 max-w-full grid-cols-[repeat(auto-fill,68px)] content-start justify-center gap-1.5 overflow-y-auto py-1"
    >
      {Array.from({ length: inventory.size }, (_slot, slotIndex) => {
        const stack = inventory.items.find((item) => item.slotIndex === slotIndex);
        const item = stack ? toSellItem(stack, itemsById) : undefined;

        return item && stack ? (
          <ShopInventorySlot
            ariaLabel={`${item.name}, quantity ${stack.quantity.toLocaleString()}`}
            isSelected={selectedSlotIndex === slotIndex}
            key={slotIndex}
            onHideDetails={onHideDetails}
            onInspect={(event) => onInspect(event, item)}
            onSelect={() => onSelect(slotIndex)}
            quantity={stack.quantity > 1 ? stack.quantity : undefined}
            shopItem={item}
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-[68px] w-[68px] rounded-[5px] border-2 border-[rgba(118,107,73,0.45)] bg-black/70"
            key={slotIndex}
          />
        );
      })}
    </div>
  );
}
