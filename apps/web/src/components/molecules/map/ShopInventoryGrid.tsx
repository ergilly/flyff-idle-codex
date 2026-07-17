import { type FocusEvent, type MouseEvent } from "react";
import { ShopInventorySlot } from "@/components/molecules/map/ShopInventorySlot";
import type { ShopInventoryItem, ShopInventoryTab } from "@/lib/townShops";

const minimumShopSlotCount = 12;

export function ShopInventoryGrid({
  activeTab,
  items,
  onHideDetails,
  onInspect,
  onSelect,
  selectedItemId
}: {
  activeTab: ShopInventoryTab;
  items: ShopInventoryItem[];
  onHideDetails: () => void;
  onInspect: (
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: ShopInventoryItem
  ) => void;
  onSelect: (itemId: string) => void;
  selectedItemId?: string;
}) {
  const emptySlotCount = Math.max(0, minimumShopSlotCount - items.length);

  return (
    <div
      aria-label={`${activeTab.label} shop inventory`}
      aria-labelledby={`general-store-tab-${activeTab.id}`}
      className="themed-scrollbar grid h-[248px] min-w-0 max-w-full grid-cols-[repeat(auto-fill,68px)] content-start justify-center gap-1.5 overflow-y-auto py-1"
      data-testid={`map_div_general_store_inventory_${activeTab.id.replaceAll("-", "_")}`}
      id={`general-store-panel-${activeTab.id}`}
      role="tabpanel"
    >
      {items.map((item) => (
        <ShopInventorySlot
          isSelected={item.id === selectedItemId}
          key={item.id}
          onHideDetails={onHideDetails}
          onInspect={(event) => onInspect(event, item)}
          onSelect={() => onSelect(item.id)}
          shopItem={item}
        />
      ))}
      {Array.from({ length: emptySlotCount }, (_emptySlot, index) => (
        <div
          aria-hidden="true"
          className="h-[68px] w-[68px] rounded-[5px] border-2 border-[rgba(118,107,73,0.45)] bg-[linear-gradient(180deg,rgba(12,12,10,0.72),rgba(0,0,0,0.82))] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.7)]"
          key={`empty-${index}`}
        />
      ))}
      {items.length === 0 ? (
        <p className="col-span-full py-6 text-center text-sm font-extrabold text-text-muted">
          No items match the selected filters.
        </p>
      ) : null}
    </div>
  );
}
