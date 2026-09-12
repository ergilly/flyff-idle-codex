"use client";

import Image from "next/image";
import type { ButtonHTMLAttributes, DragEvent, ReactNode } from "react";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { ItemDetailsPanel } from "@/components/organisms/main-application/ItemDetailsPanel";
import { ItemDetailsHoverOverlay } from "@/components/organisms/main-application/ItemDetailsHoverOverlay";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { getItemIconUrl, type Character, type InventorySortOption, type ItemMetadata } from "@/lib/api";
import { cx } from "@/lib/classNames";
import { canEquipItem } from "@/lib/itemEquipment";
import { useItemDetailsHover } from "@/hooks/useItemDetailsHover";

type InventoryPageProps = {
  actionError?: string;
  activeEquipmentSet?: number;
  character: Character;
  isActionPending?: boolean;
  itemsById: Record<string, ItemMetadata>;
  onEquipSlot?: (slotIndex: number, equipmentSet: number) => void;
  onMoveItem?: (fromSlotIndex: number, toSlotIndex: number) => void;
  onSelectSlot: (slotIndex: number | null) => void;
  onSortInventory?: (sortBy: InventorySortOption) => void;
  selectedSlotIndex: number | null;
};

const inventorySortOptions: Array<{ label: string; value: InventorySortOption }> = [
  { label: "A-Z", value: "name" },
  { label: "Level", value: "level" },
  { label: "Job", value: "job" },
  { label: "Category", value: "category" }
];

export function InventoryPage({
  actionError = "",
  activeEquipmentSet = 0,
  character,
  isActionPending = false,
  itemsById,
  onEquipSlot,
  onMoveItem,
  onSelectSlot,
  onSortInventory,
  selectedSlotIndex
}: InventoryPageProps) {
  const itemHover = useItemDetailsHover();
  const inventorySlotCount = character.inventory.size;
  const inventoryItemsBySlot = new Map(character.inventory.items.map((item) => [item.slotIndex, item]));
  const selectedInventoryItem =
    selectedSlotIndex !== null ? inventoryItemsBySlot.get(selectedSlotIndex) : undefined;
  const selectedItem = selectedInventoryItem ? itemsById[selectedInventoryItem.itemId] : null;
  const activeEquipment = character.equipmentSets?.[activeEquipmentSet] ?? character.equipment;
  const activeEquipmentItemIds = Object.values(activeEquipment).filter((itemId): itemId is string =>
    Boolean(itemId)
  );
  const canEquipSelectedItem = selectedItem
    ? canEquipItem(character, selectedItem, activeEquipment, itemsById)
    : false;

  return (
    <section
      className="grid h-full min-h-0 grid-cols-[3fr_1fr] items-stretch gap-4 max-[1100px]:grid-cols-1"
      data-testid="inventory_section_page"
    >
      <Panel
        as="section"
        className="h-full min-h-0 content-start gap-4 overflow-hidden [grid-template-rows:auto_minmax(0,1fr)]"
        data-testid="inventory_panel_grid"
      >
        <div className="flex flex-wrap items-end justify-between gap-3" data-testid="inventory_div_toolbar">
          <SectionHeading
            eyebrow="Inventory"
            testId="inventory_heading_grid"
            title={`${inventorySlotCount} slots`}
          />
          <MutedText data-testid="inventory_p_occupied_count">
            {character.inventory.items.length} / {inventorySlotCount} occupied
          </MutedText>
          <label
            className="grid min-w-[180px] gap-1 text-xs font-black uppercase tracking-[0.08em] text-text-muted"
            data-testid="inventory_label_sort"
          >
            Sort
            <select
              className="h-10 rounded-control border-2 border-border bg-panel-muted px-3 text-sm font-black normal-case tracking-normal text-foreground outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="inventory_select_sort"
              defaultValue=""
              disabled={isActionPending}
              onChange={(event) => {
                const sortBy = event.target.value as InventorySortOption;

                if (sortBy) {
                  onSortInventory?.(sortBy);
                  event.target.value = "";
                }
              }}
            >
              <option value="" disabled>
                Sort by...
              </option>
              {inventorySortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="themed-scrollbar grid min-h-0 grid-cols-[repeat(auto-fill,100px)] content-start justify-start gap-2 overflow-y-auto pr-2"
          aria-label="Inventory slots"
        >
          {Array.from({ length: inventorySlotCount }, (_slot, slotIndex) => {
            const inventoryItem = inventoryItemsBySlot.get(slotIndex);
            const item = inventoryItem ? itemsById[inventoryItem.itemId] : null;
            const iconUrl = item?.icon ? getItemIconUrl(item.icon) : null;
            const isSelected = selectedSlotIndex === slotIndex;
            const itemName = item?.name ?? inventoryItem?.itemId;
            const slotLabel = inventoryItem
              ? `Slot ${slotIndex + 1}: ${itemName}, quantity ${inventoryItem.quantity}`
              : `Slot ${slotIndex + 1}: Empty`;

            return (
              <InventorySlot
                $filled={Boolean(inventoryItem)}
                $selected={isSelected}
                aria-label={slotLabel}
                aria-pressed={isSelected}
                data-testid={`inventory_button_slot_${slotIndex}`}
                draggable={Boolean(inventoryItem) && !isActionPending}
                key={slotIndex}
                onDragOver={(event) => {
                  if (onMoveItem) {
                    event.preventDefault();
                  }
                }}
                onDragStart={(event) => {
                  if (!inventoryItem) {
                    return;
                  }

                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(slotIndex));
                }}
                onDrop={(event) => handleDrop(event, slotIndex, onMoveItem)}
                onClick={() => onSelectSlot(inventoryItem ? slotIndex : null)}
                onBlur={itemHover.hideItemDetails}
                onFocus={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                onMouseEnter={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                onMouseLeave={itemHover.hideItemDetails}
                title={slotLabel}
                type="button"
              >
                <span className="sr-only">{slotLabel}</span>
                {iconUrl ? (
                  <InventorySlotIcon alt={item?.name ?? inventoryItem?.itemId ?? ""} src={iconUrl} />
                ) : null}
                {inventoryItem && !iconUrl ? (
                  <strong className="text-[0.72rem] leading-tight text-[#f7e7a3]">
                    {inventoryItem.itemId}
                  </strong>
                ) : null}
                {inventoryItem && inventoryItem.quantity > 1 ? (
                  <InventoryQuantity>{inventoryItem.quantity}</InventoryQuantity>
                ) : null}
              </InventorySlot>
            );
          })}
        </div>
      </Panel>
      <ItemDetailsPanel
        actionDisabled={isActionPending}
        actionError={actionError}
        className="themed-scrollbar h-full max-h-full max-w-none overflow-y-auto border-border"
        character={character}
        emptyDescription="Select an inventory item to inspect its stats."
        equippedItemIds={activeEquipmentItemIds}
        item={selectedItem}
        slotLabel={selectedSlotIndex !== null ? `Inventory ${selectedSlotIndex + 1}` : null}
      >
        {selectedInventoryItem && onEquipSlot && canEquipSelectedItem ? (
          <div className="grid gap-2">
            <span
              className="text-[0.78rem] font-extrabold uppercase text-text-muted"
              data-testid="inventory_span_equip_label"
            >
              Equip to set
            </span>
            <div className="grid grid-cols-3 gap-2" data-testid="inventory_div_equip_actions">
              {[0, 1, 2].map((equipmentSet) => (
                <button
                  aria-label={`Equip to set ${equipmentSet + 1}`}
                  data-testid={`inventory_button_equip_set_${equipmentSet}`}
                  className={cx(
                    "min-h-10 rounded-control border-2 px-2 text-sm font-black transition-colors disabled:cursor-wait disabled:opacity-60",
                    activeEquipmentSet === equipmentSet
                      ? "border-[#f5d46a] bg-[linear-gradient(180deg,#ffe07a,#b9851f)] text-button-text"
                      : "border-border bg-panel-muted text-foreground hover:border-primary"
                  )}
                  disabled={isActionPending}
                  key={equipmentSet}
                  onClick={() => onEquipSlot(selectedInventoryItem.slotIndex, equipmentSet)}
                  type="button"
                >
                  {equipmentSet + 1}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </ItemDetailsPanel>
      {itemHover.inspectedItem ? (
        <ItemDetailsHoverOverlay
          {...itemHover.inspectedItem}
          character={character}
          equippedItemIds={activeEquipmentItemIds}
        />
      ) : null}
    </section>
  );
}

function handleDrop(
  event: DragEvent<HTMLButtonElement>,
  toSlotIndex: number,
  onMoveItem?: (fromSlotIndex: number, toSlotIndex: number) => void
) {
  if (!onMoveItem) {
    return;
  }

  event.preventDefault();
  const rawFromSlotIndex = event.dataTransfer.getData("text/plain");

  if (!rawFromSlotIndex) {
    return;
  }

  const fromSlotIndex = Number(rawFromSlotIndex);

  if (Number.isInteger(fromSlotIndex) && fromSlotIndex >= 0 && fromSlotIndex !== toSlotIndex) {
    onMoveItem(fromSlotIndex, toSlotIndex);
  }
}

type InventorySlotProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  $filled: boolean;
  $selected: boolean;
};

function InventorySlot({ $filled, $selected, children, className, ...props }: InventorySlotProps) {
  return (
    <button
      className={cx(
        "relative grid h-[100px] w-[100px] place-items-center rounded-[5px] border-2 border-[rgba(118,107,73,0.72)] bg-[linear-gradient(180deg,rgba(12,12,10,0.94),rgba(0,0,0,0.98))] p-1 text-center shadow-[inset_0_0_0_2px_rgba(0,0,0,0.9),inset_0_0_12px_rgba(214,199,119,0.1),0_0_8px_rgba(0,0,0,0.4)] disabled:opacity-100",
        $filled ? "cursor-pointer" : "cursor-default",
        $selected &&
          "outline outline-1 -outline-offset-4 outline-[rgba(255,222,91,0.74)] shadow-[inset_0_0_18px_rgba(255,216,76,0.2)]",
        $filled &&
          "hover:outline hover:outline-1 hover:-outline-offset-4 hover:outline-[rgba(255,222,91,0.74)] hover:shadow-[inset_0_0_18px_rgba(255,216,76,0.2)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function InventorySlotIcon({ alt, src }: { alt: string; src: string }) {
  return (
    <Image
      className="h-[86%] w-[86%] object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.72))]"
      src={src}
      alt={alt}
      loading="lazy"
      width={52}
      height={52}
      unoptimized
    />
  );
}

function InventoryQuantity({ children }: { children: ReactNode }) {
  return (
    <span className="absolute bottom-1 right-1 rounded-[3px] border border-[rgba(229,191,73,0.42)] bg-[rgba(0,0,0,0.78)] px-1.5 py-0.5 text-[0.68rem] font-black leading-none text-[#fff1ba] shadow-[0_0_10px_rgba(187,161,89,0.18)]">
      {children}
    </span>
  );
}
