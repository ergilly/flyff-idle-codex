import { Panel } from "@/components/atoms/Panel";
import { ShopInventorySlot } from "@/components/molecules/map/ShopInventorySlot";
import type { CharacterInventory, ItemMetadata } from "@/lib/api/types";
import { toSellItem } from "@/lib/shopInventory";
import type { ShopInventoryItem } from "@/lib/townShops";
import type { FocusEvent, MouseEvent } from "react";

export function CharacterShopInventory({
  inventory,
  itemsById,
  onHideDetails,
  onInspect,
  onSelect,
  selectedSlotIndex
}: {
  inventory: CharacterInventory;
  itemsById: Record<string, ItemMetadata>;
  onHideDetails: () => void;
  onInspect: (
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: ShopInventoryItem
  ) => void;
  onSelect: (slotIndex: number) => void;
  selectedSlotIndex: number | null;
}) {
  return (
    <Panel
      as="section"
      className="min-w-0 max-w-full content-start gap-2 overflow-hidden border-border bg-panel-muted p-3"
    >
      <div>
        <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">Sell items</p>
        <h4 className="font-black text-foreground">Character Inventory</h4>
      </div>
      <div
        aria-label="Character inventory for selling"
        className="themed-scrollbar grid h-[220px] min-w-0 max-w-full grid-cols-[repeat(auto-fill,68px)] content-start justify-center gap-1.5 overflow-y-auto py-1"
      >
        {Array.from({ length: inventory.size }, (_slot, slotIndex) => {
          const stack = inventory.items.find((item) => item.slotIndex === slotIndex);
          const saleItem = stack ? toSellItem(stack, itemsById) : undefined;

          return saleItem && stack ? (
            <ShopInventorySlot
              isSelected={selectedSlotIndex === slotIndex}
              key={slotIndex}
              onHideDetails={onHideDetails}
              onInspect={(event) => onInspect(event, saleItem)}
              onSelect={() => onSelect(slotIndex)}
              quantity={saleItem.stack && saleItem.stack > 1 ? stack.quantity : undefined}
              shopItem={saleItem}
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
    </Panel>
  );
}
