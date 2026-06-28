"use client";

import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { Stack } from "@/components/atoms/Stack";
import { StatRow } from "@/components/atoms/StatRow";
import { TextField } from "@/components/atoms/TextField";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { fetchDataSet, getItemIconUrl, type Character, type ItemMetadata } from "@/lib/api";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

type AdminPageProps = {
  addingInventoryItem: boolean;
  character: Character;
  error: string;
  onAddInventoryItem: (itemId: string, quantity: number) => void;
  refundingAction: "stats" | "skills" | null;
  onRefundSkills: () => void;
  onRefundStats: () => void;
};

export function AdminPage({
  addingInventoryItem,
  character,
  error,
  onAddInventoryItem,
  refundingAction,
  onRefundSkills,
  onRefundStats
}: AdminPageProps) {
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState<ItemMetadata[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemMetadata | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const assignedStatPoints =
    character.stats.str + character.stats.sta + character.stats.dex + character.stats.int - 60;
  const assignedSkillLevels = Object.values(character.skillLevels).reduce((total, level) => total + level, 0);
  const nextOpenSlot = Array.from({ length: character.inventory.size }, (_slot, index) => index).find(
    (index) => !character.inventory.items.some((item) => item.slotIndex === index)
  );
  const selectedItemStackSize = selectedItem?.stack && selectedItem.stack > 0 ? selectedItem.stack : 1;
  const hasAvailableStackSpace = Boolean(
    selectedItem &&
    character.inventory.items.some(
      (item) => item.itemId === String(selectedItem.id) && item.quantity < selectedItemStackSize
    )
  );

  async function handleSearchItems(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!itemQuery.trim()) {
      setItemResults([]);
      setSearchError("Enter an item name or id.");
      return;
    }

    setSearchError("");
    setIsSearching(true);

    try {
      const results = await fetchDataSet<ItemMetadata>("items", {
        fields: "id,name,icon,category,level,rarity,stack",
        limit: 12,
        q: itemQuery.trim()
      });
      setItemResults(results);
      setSelectedItem(results[0] ?? null);
      if (results.length === 0) {
        setSearchError("No matching items found.");
      }
    } catch {
      setSearchError("Unable to search items.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleAddInventoryItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedItem) {
      setSearchError("Select an item to add.");
      return;
    }

    onAddInventoryItem(String(selectedItem.id), Math.min(9999, Math.max(1, quantity || 1)));
  }

  return (
    <div className="grid max-w-[1120px] gap-4" data-testid="admin_div_page">
      <Panel className="content-start gap-5" data-testid="admin_panel_refunds">
        <SectionHeading eyebrow="Admin" testId="admin_heading_refunds" title="Point refunds" />
        <Stack>
          <MutedText data-testid="admin_p_refunds_description">
            Refund all assigned stat and skill points for the current character.
          </MutedText>
          <div
            className="grid gap-2 rounded-card border-2 border-border bg-panel-muted p-4"
            data-testid="admin_div_refund_summary"
          >
            <StatRow data-testid="admin_stat_character" label="Character" value={character.name} />
            <StatRow
              data-testid="admin_stat_assigned_stats"
              label="Assigned stat points"
              value={Math.max(0, assignedStatPoints)}
            />
            <StatRow
              data-testid="admin_stat_assigned_skills"
              label="Assigned skill levels"
              value={assignedSkillLevels}
            />
          </div>
          {error ? <ErrorMessage message={error} testId="admin_error_refunds" /> : null}
          <div
            className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1"
            data-testid="admin_div_refund_actions"
          >
            <Button
              data-testid="admin_button_refund_stats"
              type="button"
              onClick={onRefundStats}
              disabled={refundingAction !== null}
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw aria-hidden="true" size={18} />
                {refundingAction === "stats" ? "Refunding..." : "Refund stat points"}
              </span>
            </Button>
            <Button
              data-testid="admin_button_refund_skills"
              type="button"
              onClick={onRefundSkills}
              disabled={refundingAction !== null}
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw aria-hidden="true" size={18} />
                {refundingAction === "skills" ? "Refunding..." : "Refund skill points"}
              </span>
            </Button>
          </div>
        </Stack>
      </Panel>

      <Panel as="section" className="content-start gap-5" data-testid="admin_panel_inventory">
        <SectionHeading eyebrow="Creative inventory" testId="admin_heading_inventory" title="Add item" />
        <div
          className="grid grid-cols-[minmax(280px,0.9fr)_minmax(320px,1.1fr)] gap-4 max-[920px]:grid-cols-1"
          data-testid="admin_div_inventory_workspace"
        >
          <Stack
            as="form"
            className="self-start rounded-card border-2 border-border bg-panel-muted p-4 shadow-[inset_0_0_0_1px_rgba(255,225,115,0.08)]"
            data-testid="admin_form_item_search"
            onSubmit={handleSearchItems}
          >
            <TextField
              data-testid="admin_input_item_search"
              id="adminItemSearch"
              label="Item search"
              name="adminItemSearch"
              placeholder="Sword, potion, 3497..."
              type="search"
              value={itemQuery}
              onChange={(event) => setItemQuery(event.target.value)}
            />
            <Button data-testid="admin_button_item_search" type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search items"}
            </Button>
            {searchError ? <ErrorMessage message={searchError} testId="admin_error_item_search" /> : null}
            <div
              className="themed-scrollbar grid h-[360px] content-start gap-2 overflow-y-auto pr-2"
              data-testid="admin_div_item_results"
            >
              {itemResults.length > 0 ? (
                itemResults.map((item) => (
                  <ItemResultButton
                    item={item}
                    isSelected={String(selectedItem?.id) === String(item.id)}
                    key={String(item.id)}
                    onClick={() => setSelectedItem(item)}
                  />
                ))
              ) : (
                <div
                  className="grid h-full place-items-center rounded-control border border-dashed border-border bg-panel text-center text-sm font-bold text-text-muted"
                  data-testid="admin_div_item_results_empty"
                >
                  Search results will appear here.
                </div>
              )}
            </div>
          </Stack>

          <Stack
            as="form"
            className="self-start"
            data-testid="admin_form_add_inventory_item"
            onSubmit={handleAddInventoryItem}
          >
            <div
              className="grid gap-2 rounded-card border-2 border-border bg-panel-muted p-4"
              data-testid="admin_div_selected_item_summary"
            >
              <StatRow
                data-testid="admin_stat_selected_item"
                label="Selected item"
                value={selectedItem ? selectedItem.name : "None"}
              />
              <StatRow
                data-testid="admin_stat_selected_item_id"
                label="Item id"
                value={selectedItem ? String(selectedItem.id) : "-"}
              />
              <StatRow
                data-testid="admin_stat_next_open_slot"
                label="Next open slot"
                value={
                  nextOpenSlot !== undefined
                    ? nextOpenSlot + 1
                    : hasAvailableStackSpace
                      ? "Existing stack"
                      : "Full"
                }
              />
            </div>
            <TextField
              data-testid="admin_input_item_quantity"
              id="adminItemQuantity"
              label="Quantity"
              min={1}
              max={9999}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
            <Button
              data-testid="admin_button_add_inventory_item"
              type="submit"
              disabled={
                !selectedItem ||
                addingInventoryItem ||
                (nextOpenSlot === undefined && !hasAvailableStackSpace)
              }
            >
              {addingInventoryItem ? "Adding..." : "Add to inventory"}
            </Button>
          </Stack>
        </div>
      </Panel>
    </div>
  );
}

function ItemResultButton({
  isSelected,
  item,
  onClick
}: {
  isSelected: boolean;
  item: ItemMetadata;
  onClick: () => void;
}) {
  const iconUrl = item.icon ? getItemIconUrl(item.icon) : null;

  return (
    <button
      className={cx(
        "flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-control border-2 bg-panel-muted p-2.5 text-left transition-colors hover:border-primary",
        isSelected ? "border-primary text-foreground" : "border-border text-text-muted"
      )}
      data-testid={`admin_button_item_result_${getTestIdSegment(item.id)}`}
      type="button"
      onClick={onClick}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-control border border-border bg-panel">
        {iconUrl ? (
          <Image
            className="max-h-10 max-w-10 object-contain"
            src={iconUrl}
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            loading="lazy"
            unoptimized
          />
        ) : null}
      </span>
      <span
        className="grid min-w-0 flex-1 gap-1"
        data-testid={`admin_span_item_result_content_${getTestIdSegment(item.id)}`}
      >
        <strong
          className="line-clamp-2 text-sm leading-snug text-foreground"
          data-testid={`admin_strong_item_result_name_${getTestIdSegment(item.id)}`}
        >
          {item.name}
        </strong>
        <span
          className="break-words text-xs font-bold uppercase leading-snug"
          data-testid={`admin_span_item_result_meta_${getTestIdSegment(item.id)}`}
        >
          #{String(item.id)}
          {item.category ? ` - ${item.category}` : ""}
          {item.level !== null ? ` - Lv. ${item.level}` : ""}
        </span>
      </span>
    </button>
  );
}
