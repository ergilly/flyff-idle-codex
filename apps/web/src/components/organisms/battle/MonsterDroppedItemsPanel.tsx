"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { ItemDetailsHoverOverlay } from "@/components/organisms/main-application/ItemDetailsHoverOverlay";
import { DropItemImage } from "@/components/molecules/battle/DropItemImages";
import { type ItemMetadata } from "@/lib/api";
import { getDropRarityBorderClass, getDropRarityTextClass, isQuestDropItem } from "@/lib/battle/loot";
import { type BattleDroppedItem } from "@/lib/battle/types";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";
import { useItemDetailsHover } from "@/hooks/useItemDetailsHover";

export function MonsterDroppedItemsPanel({
  droppedItems,
  isLootPending,
  itemsById,
  onDeleteDroppedItems,
  onLootAllDroppedItems,
  onLootDroppedItem,
  onLootSelectedDroppedItem,
  onSelectDroppedItem,
  selectedDroppedItemId
}: {
  droppedItems: BattleDroppedItem[];
  isLootPending: boolean;
  itemsById: Record<string, ItemMetadata>;
  onDeleteDroppedItems: () => void;
  onLootAllDroppedItems: () => void;
  onLootDroppedItem: (drop: BattleDroppedItem) => void;
  onLootSelectedDroppedItem: () => void;
  onSelectDroppedItem: (itemId: string) => void;
  selectedDroppedItemId: string | null;
}) {
  const itemHover = useItemDetailsHover();
  const hasDroppedItems = droppedItems.length > 0;

  return (
    <Panel
      as="section"
      className="h-full min-h-0 gap-3 [grid-template-rows:auto_minmax(0,1fr)]"
      data-testid="battle_panel_monster_dropped_items"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading eyebrow="Drops" testId="battle_heading_monster_dropped_items" />
        <div className="flex flex-wrap gap-2" data-testid="battle_div_monster_dropped_item_actions">
          <Button
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_loot_selected_drop"
            disabled={!hasDroppedItems || !selectedDroppedItemId || isLootPending}
            onClick={onLootSelectedDroppedItem}
            type="button"
          >
            Loot
          </Button>
          <Button
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_loot_all_drops"
            disabled={!hasDroppedItems || isLootPending}
            onClick={onLootAllDroppedItems}
            type="button"
            variant="secondary"
          >
            Loot all
          </Button>
          <Button
            aria-label="Delete remaining dropped items"
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_delete_drops"
            disabled={!hasDroppedItems || isLootPending}
            onClick={onDeleteDroppedItems}
            title="Delete remaining dropped items"
            type="button"
            variant="secondary"
          >
            <Trash2 aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>
      <div
        className="grid min-h-0 overflow-y-auto rounded-control border border-dashed border-[rgba(138,116,65,0.62)] bg-black/24 p-3 pr-2 [scrollbar-color:rgba(245,212,81,0.55)_rgba(0,0,0,0.28)] [scrollbar-width:thin]"
        data-testid="battle_div_monster_dropped_items_inventory"
      >
        {hasDroppedItems ? (
          <ol
            className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] content-start gap-2"
            data-testid="battle_list_monster_dropped_items"
          >
            {droppedItems.map((drop) => {
              const item = itemsById[drop.itemId];
              const itemName = item?.name ?? `Item ${drop.itemId}`;
              const isSelected = selectedDroppedItemId === drop.itemId;

              return (
                <li
                  data-testid={`battle_li_monster_dropped_item_${getTestIdSegment(itemName)}`}
                  key={drop.itemId}
                >
                  <button
                    aria-label={`Select dropped item ${itemName}`}
                    aria-pressed={isSelected}
                    className={cx(
                      "grid w-full min-w-0 grid-cols-[42px_1fr] items-center gap-3 rounded-control border bg-black/24 p-2 text-left text-sm font-bold transition-colors hover:border-primary disabled:cursor-wait disabled:opacity-70",
                      getDropRarityBorderClass(item?.rarity),
                      isSelected ? "bg-[rgba(245,212,81,0.14)] ring-2 ring-[#f5d451]/55" : ""
                    )}
                    data-testid={`battle_button_monster_dropped_item_${getTestIdSegment(itemName)}`}
                    disabled={isLootPending}
                    onClick={() => onSelectDroppedItem(drop.itemId)}
                    onDoubleClick={() => onLootDroppedItem(drop)}
                    onBlur={itemHover.hideItemDetails}
                    onFocus={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                    onMouseEnter={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                    onMouseLeave={itemHover.hideItemDetails}
                    type="button"
                  >
                    <DropItemImage icon={item?.icon} isQuestDrop={isQuestDropItem(item)} name={itemName} />
                    <span className="grid min-w-0 gap-0.5">
                      <strong
                        className={cx("min-w-0 truncate", getDropRarityTextClass(item?.rarity))}
                        data-testid={`battle_strong_monster_dropped_item_name_${getTestIdSegment(itemName)}`}
                      >
                        {itemName}
                      </strong>
                      <span
                        className="text-xs font-black uppercase tracking-wide text-text-muted"
                        data-testid={`battle_span_monster_dropped_item_quantity_${getTestIdSegment(itemName)}`}
                      >
                        x{drop.quantity.toLocaleString()}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="grid place-items-center">
            <MutedText data-testid="battle_p_monster_dropped_items_empty">
              No items have dropped yet.
            </MutedText>
          </div>
        )}
      </div>
      {itemHover.inspectedItem ? <ItemDetailsHoverOverlay {...itemHover.inspectedItem} /> : null}
    </Panel>
  );
}
