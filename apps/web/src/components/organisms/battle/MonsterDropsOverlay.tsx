"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { InfoRow } from "@/components/atoms/battle/CombatInfoRow";
import { MutedText } from "@/components/atoms/MutedText";
import { DropItemImage, SmallDropItemImage } from "@/components/molecules/battle/DropItemImages";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { ItemDetailsHoverOverlay } from "@/components/organisms/main-application/ItemDetailsHoverOverlay";
import { type ItemMetadata, type MapMonsterFamily, type MonsterFamilyVariant } from "@/lib/api";
import {
  dropCategoryLabels,
  dropCategoryOrder,
  formatBattleValue,
  getDropCategory,
  getDropRarityBorderClass,
  getDropRarityTextClass,
  isQuestDropItem
} from "@/lib/battle/loot";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";
import { useItemDetailsHover } from "@/hooks/useItemDetailsHover";

export function MonsterDropsOverlay({
  itemsById,
  monsterFamily,
  onClose,
  selectedVariant
}: {
  itemsById: Record<string, ItemMetadata>;
  monsterFamily: MapMonsterFamily | null;
  onClose: () => void;
  selectedVariant: MonsterFamilyVariant | null;
}) {
  const itemHover = useItemDetailsHover();
  const [collapsedDropSections, setCollapsedDropSections] = useState<Set<string>>(() => new Set());
  const drops = selectedVariant?.drops ?? [];
  const explicitQuestDrops = monsterFamily?.questDrops ?? [];
  const questDropsById = new Map(explicitQuestDrops.map((drop) => [String(drop.id), drop]));

  drops.forEach((drop) => {
    const item = itemsById[String(drop.item)];

    if (isQuestDropItem(item) && !questDropsById.has(String(drop.item))) {
      questDropsById.set(String(drop.item), {
        id: drop.item,
        icon: item?.icon ?? null,
        name: item?.name ?? `Item ${drop.item}`
      });
    }
  });

  const questDrops = Array.from(questDropsById.values());
  const questDropItemIds = new Set(questDrops.map((drop) => String(drop.id)));
  const regularDrops = drops.filter((drop) => !questDropItemIds.has(String(drop.item)));
  const groupedRegularDrops = dropCategoryOrder
    .map((category) => ({
      category,
      drops: regularDrops.filter((drop) => getDropCategory(itemsById[String(drop.item)]) === category),
      label: dropCategoryLabels[category]
    }))
    .filter((group) => group.drops.length > 0);
  const goldRange = selectedVariant
    ? `${formatBattleValue(selectedVariant.minDropGold)} - ${formatBattleValue(selectedVariant.maxDropGold)}`
    : "Unknown";

  function isDropSectionCollapsed(sectionId: string) {
    return collapsedDropSections.has(sectionId);
  }

  function toggleDropSection(sectionId: string) {
    setCollapsedDropSections((current) => {
      const next = new Set(current);

      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }

      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-4"
      data-testid="battle_div_monster_drops_overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Monster drops: ${selectedVariant?.name ?? "No target"}`}
    >
      <div className="grid w-full max-w-[420px] gap-4 rounded-card border-2 border-[rgba(226,179,63,0.58)] bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(5,6,5,0.98))] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.46)]">
        <div className="flex items-start justify-between gap-3">
          <SectionHeading
            eyebrow="Drops"
            testId="battle_heading_monster_drops_overlay"
            title={selectedVariant?.name ?? "No target"}
          />
          <Button
            className="min-h-9 px-3 text-sm"
            data-testid="battle_button_close_monster_drops"
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Close
          </Button>
        </div>
        <div className="grid gap-2 text-sm font-bold" data-testid="battle_div_monster_drops_summary">
          <InfoRow label="Penya" value={goldRange} />
          {questDrops.map((questDrop, index) => {
            const item = itemsById[String(questDrop.id)];

            return (
              <button
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                data-testid={`battle_div_monster_quest_drop_${index}`}
                key={`${questDrop.id}-${index}`}
                onBlur={itemHover.hideItemDetails}
                onFocus={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                onMouseEnter={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                onMouseLeave={itemHover.hideItemDetails}
                type="button"
              >
                <span
                  className="text-text-muted"
                  data-testid={`battle_span_monster_quest_drop_label_${index}`}
                >
                  Quest Item
                </span>
                <span className="grid min-w-0 grid-cols-[minmax(0,auto)_36px] items-center justify-end gap-2">
                  <strong
                    className="min-w-0 truncate text-right !text-sm"
                    data-testid={`battle_strong_monster_quest_drop_name_${index}`}
                  >
                    {item?.name ?? questDrop.name}
                  </strong>
                  <SmallDropItemImage
                    icon={item?.icon ?? questDrop.icon}
                    name={item?.name ?? questDrop.name}
                  />
                </span>
              </button>
            );
          })}
        </div>
        {groupedRegularDrops.length > 0 ? (
          <div className="grid max-h-[320px] gap-2 overflow-auto" data-testid="battle_div_monster_drops_list">
            {groupedRegularDrops.map((group) => {
              const isCollapsed = isDropSectionCollapsed(group.category);

              return (
                <div
                  className="grid gap-2 rounded-control border border-[rgba(138,116,65,0.42)] bg-black/18 p-2"
                  data-testid={`battle_div_monster_drops_category_${getTestIdSegment(group.label)}`}
                  key={group.category}
                >
                  <h3 className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted">
                    <button
                      aria-expanded={!isCollapsed}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left"
                      data-testid={`battle_heading_monster_drops_category_${getTestIdSegment(group.label)}`}
                      onClick={() => toggleDropSection(group.category)}
                      type="button"
                    >
                      <span>{group.label}</span>
                      <span aria-hidden="true">{isCollapsed ? "+" : "-"}</span>
                    </button>
                  </h3>
                  {!isCollapsed ? (
                    <div className="grid gap-2">
                      {group.drops.map((drop, index) => {
                        const item = itemsById[String(drop.item)];

                        return (
                          <button
                            className={cx(
                              "grid grid-cols-[42px_1fr] items-center gap-3 rounded-control border bg-black/24 p-2 text-sm font-bold",
                              getDropRarityBorderClass(item?.rarity)
                            )}
                            data-testid={`battle_div_monster_drop_${getTestIdSegment(group.label)}_${index}`}
                            key={`${drop.item}-${index}`}
                            onBlur={itemHover.hideItemDetails}
                            onFocus={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                            onMouseEnter={(event) => (item ? itemHover.inspectItem(item, event) : undefined)}
                            onMouseLeave={itemHover.hideItemDetails}
                            type="button"
                          >
                            <DropItemImage icon={item?.icon} isQuestDrop={false} name={item?.name} />
                            <div className="grid min-w-0 gap-0.5">
                              <strong
                                className={cx("min-w-0 truncate", getDropRarityTextClass(item?.rarity))}
                                data-testid={`battle_strong_monster_drop_name_${getTestIdSegment(group.label)}_${index}`}
                              >
                                {item?.name ?? `Item ${drop.item}`}
                              </strong>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : drops.length === 0 && questDrops.length === 0 ? (
          <MutedText data-testid="battle_p_no_monster_drops">No drops are listed for this monster.</MutedText>
        ) : null}
      </div>
      {itemHover.inspectedItem ? <ItemDetailsHoverOverlay {...itemHover.inspectedItem} /> : null}
    </div>
  );
}
