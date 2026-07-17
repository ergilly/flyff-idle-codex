"use client";

import Image from "next/image";
import { type FocusEvent, type MouseEvent, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Panel } from "@/components/atoms/Panel";
import {
  ShopInventorySlot,
  ShopItemDetailsOverlay,
  toSellItem
} from "@/components/organisms/map/ShopInventoryWidgets";
import { type CharacterInventory, type ItemMetadata } from "@/lib/api/types";
import { cx } from "@/lib/classNames";
import {
  flarineGeneralStoreTabs,
  type ShopInventoryItem,
  type ShopInventoryTab,
  type ShopMerchant
} from "@/lib/townShops";

type GeneralStorePanelProps = {
  characterLevel?: number;
  characterInventory?: CharacterInventory;
  characterPenya?: number;
  characterSex?: "female" | "male";
  iconSrc?: string;
  shopMerchants?: ShopMerchant[];
  shopName?: string;
  shopTabs?: ShopInventoryTab[];
  townName?: string;
  onBuyItem?: (itemId: string, quantity: number) => Promise<void>;
  onSellItem?: (slotIndex: number, quantity: number) => Promise<void>;
  itemsById?: Record<string, ItemMetadata>;
};

const minimumShopSlotCount = 12;

export function GeneralStorePanel({
  characterLevel,
  characterInventory,
  characterPenya,
  characterSex,
  iconSrc = "/images/maps/town-icons/general-store.png",
  onBuyItem,
  onSellItem,
  itemsById = {},
  shopMerchants,
  shopName = "General Store",
  shopTabs = flarineGeneralStoreTabs,
  townName = "Flarine"
}: GeneralStorePanelProps) {
  const merchants = shopMerchants ?? [{ id: "default", name: shopName, tabs: shopTabs }];
  const [activeMerchantId, setActiveMerchantId] = useState(merchants[0].id);
  const activeMerchant = merchants.find((merchant) => merchant.id === activeMerchantId) ?? merchants[0];
  const activeMerchantTabs = activeMerchant.tabs;
  const [activeTabId, setActiveTabId] = useState(activeMerchantTabs[0].id);
  const [selectedItemId, setSelectedItemId] = useState(activeMerchantTabs[0].items[0].id);
  const [quantity, setQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [filterByLevel, setFilterByLevel] = useState(false);
  const [filterBySex, setFilterBySex] = useState(false);
  const [transactionMode, setTransactionMode] = useState<"buy" | "sell">("buy");
  const [selectedInventorySlotIndex, setSelectedInventorySlotIndex] = useState<number | null>(null);
  const [inspectedItem, setInspectedItem] = useState<{
    item: ShopInventoryItem;
    rect: DOMRect;
  } | null>(null);
  const activeTab = activeMerchantTabs.find((tab) => tab.id === activeTabId) ?? activeMerchantTabs[0];
  const visibleItems = activeTab.items.filter((item) =>
    meetsShopFilters(item, { characterLevel, characterSex, filterByLevel, filterBySex })
  );
  const selectedItem = visibleItems.find((shopItem) => shopItem.id === selectedItemId) ?? visibleItems[0];
  const selectedInventoryStack = characterInventory?.items.find(
    (item) => item.slotIndex === selectedInventorySlotIndex
  );
  const selectedInventoryMetadata = selectedInventoryStack
    ? itemsById[selectedInventoryStack.itemId]
    : undefined;
  const selectedSellItem =
    selectedInventoryStack && selectedInventoryMetadata?.icon
      ? ({
          ...selectedInventoryMetadata,
          icon: selectedInventoryMetadata.icon,
          maxStack: selectedInventoryStack.quantity,
          price: selectedInventoryMetadata.sellPrice ?? 0
        } satisfies ShopInventoryItem)
      : undefined;
  const transactionItem = transactionMode === "sell" ? selectedSellItem : selectedItem;
  const maximumQuantity =
    transactionMode === "sell" ? (selectedInventoryStack?.quantity ?? 1) : (selectedItem?.maxStack ?? 1);
  const emptySlotCount = Math.max(0, minimumShopSlotCount - visibleItems.length);
  const totalPrice = transactionItem ? transactionItem.price * quantity : 0;
  const canAffordSelectedItem =
    transactionItem !== undefined &&
    transactionItem.price > 0 &&
    (transactionMode === "sell" || characterPenya === undefined || characterPenya >= totalPrice);
  const shopFilters = (
    <fieldset className="grid content-start gap-3 rounded-control border-2 border-border bg-black/25 px-2 py-3">
      <legend className="px-1 text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
        Filters
      </legend>
      <ShopFilterCheckbox
        checked={filterBySex}
        disabled={!characterSex}
        label="By sex"
        onChange={(checked) => updateFilter("sex", checked)}
      />
      <ShopFilterCheckbox
        checked={filterByLevel}
        disabled={characterLevel === undefined}
        label="By level"
        onChange={(checked) => updateFilter("level", checked)}
      />
    </fieldset>
  );

  function selectTab(tabId: string) {
    const nextTab = activeMerchantTabs.find((tab) => tab.id === tabId);

    if (!nextTab) {
      return;
    }

    setActiveTabId(tabId);
    const nextItems = nextTab.items.filter((item) =>
      meetsShopFilters(item, { characterLevel, characterSex, filterByLevel, filterBySex })
    );
    setSelectedItemId(nextItems[0]?.id ?? "");
    setQuantity(1);
    setPurchaseError("");
  }

  function selectMerchant(merchantId: string) {
    const nextMerchant = merchants.find((merchant) => merchant.id === merchantId);
    const firstTab = nextMerchant?.tabs[0];

    if (!nextMerchant || !firstTab) return;

    setActiveMerchantId(merchantId);
    setActiveTabId(firstTab.id);
    const nextItems = firstTab.items.filter((item) =>
      meetsShopFilters(item, { characterLevel, characterSex, filterByLevel, filterBySex })
    );
    setSelectedItemId(nextItems[0]?.id ?? "");
    setQuantity(1);
    setPurchaseError("");
  }

  async function submitTransaction() {
    if (!transactionItem || !canAffordSelectedItem) {
      return;
    }

    setIsPurchasing(true);
    setPurchaseError("");

    try {
      if (transactionMode === "sell" && selectedInventoryStack && onSellItem) {
        await onSellItem(selectedInventoryStack.slotIndex, quantity);
      } else if (transactionMode === "buy" && selectedItem && onBuyItem) {
        await onBuyItem(selectedItem.id, quantity);
      }
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Unable to purchase item");
    } finally {
      setIsPurchasing(false);
    }
  }

  function updateFilter(filter: "level" | "sex", checked: boolean) {
    const nextFilterByLevel = filter === "level" ? checked : filterByLevel;
    const nextFilterBySex = filter === "sex" ? checked : filterBySex;
    const nextItems = activeTab.items.filter((item) =>
      meetsShopFilters(item, {
        characterLevel,
        characterSex,
        filterByLevel: nextFilterByLevel,
        filterBySex: nextFilterBySex
      })
    );

    if (filter === "level") setFilterByLevel(checked);
    else setFilterBySex(checked);
    setSelectedItemId(nextItems[0]?.id ?? "");
    setQuantity(1);
    setPurchaseError("");
    setInspectedItem(null);
  }

  function inspectItem(
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: ShopInventoryItem
  ) {
    setInspectedItem({ item, rect: event.currentTarget.getBoundingClientRect() });
  }

  return (
    <Panel
      as="section"
      className="min-h-0 min-w-0 max-w-full content-start gap-3 overflow-hidden border-primary p-3"
      data-testid="map_section_general_store"
    >
      <div className="flex items-center gap-3">
        <Image
          className="h-11 w-11 object-contain"
          src={iconSrc}
          alt=""
          aria-hidden="true"
          width={44}
          height={44}
          unoptimized
        />
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">{townName} shop</p>
          <h3 className="text-lg font-black text-foreground">{shopName}</h3>
        </div>
      </div>

      {merchants.length > 1 ? (
        <div
          aria-label={`${shopName} merchants`}
          className="themed-scrollbar flex h-[52px] w-full min-w-0 max-w-full gap-1 overflow-x-auto rounded-control border-2 border-primary/60 bg-panel-muted p-1"
          role="tablist"
        >
          {merchants.map((merchant) => (
            <button
              aria-selected={merchant.id === activeMerchant.id}
              className={cx(
                "min-h-10 shrink-0 whitespace-nowrap rounded-control border-2 px-3 text-xs font-black transition-colors",
                merchant.id === activeMerchant.id
                  ? "border-primary bg-panel text-foreground"
                  : "border-transparent text-text-muted hover:text-foreground"
              )}
              key={merchant.id}
              onClick={() => selectMerchant(merchant.id)}
              role="tab"
              type="button"
            >
              {merchant.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid min-w-0 max-w-full gap-2 overflow-hidden rounded-control border-2 border-border bg-black/35 p-2">
        <div
          aria-label={`${shopName} departments`}
          className="themed-scrollbar flex h-11 w-full min-w-0 max-w-full gap-1 overflow-x-auto rounded-control bg-panel-muted p-1"
          role="tablist"
        >
          {activeMerchantTabs.map((tab) => (
            <button
              key={tab.id}
              aria-controls={`general-store-panel-${tab.id}`}
              aria-selected={activeTab.id === tab.id}
              className={cx(
                "min-h-9 shrink-0 whitespace-nowrap rounded-control border-2 px-2 text-xs font-extrabold transition-colors",
                activeTab.id === tab.id
                  ? "border-primary bg-panel text-foreground"
                  : "border-transparent bg-transparent text-text-muted hover:text-foreground"
              )}
              id={`general-store-tab-${tab.id}`}
              onClick={() => selectTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          aria-label={`${activeTab.label} shop inventory`}
          aria-labelledby={`general-store-tab-${activeTab.id}`}
          className="themed-scrollbar grid h-[248px] min-w-0 max-w-full grid-cols-[repeat(auto-fill,68px)] content-start justify-center gap-1.5 overflow-y-auto py-1"
          data-testid={`map_div_general_store_inventory_${activeTab.id.replaceAll("-", "_")}`}
          id={`general-store-panel-${activeTab.id}`}
          role="tabpanel"
        >
          {visibleItems.map((shopItem) => (
            <ShopInventorySlot
              isSelected={shopItem.id === selectedItem?.id}
              key={shopItem.id}
              onHideDetails={() => setInspectedItem(null)}
              onInspect={(event) => inspectItem(event, shopItem)}
              onSelect={() => {
                setTransactionMode("buy");
                setSelectedItemId(shopItem.id);
                setQuantity(1);
                setPurchaseError("");
              }}
              shopItem={shopItem}
            />
          ))}
          {Array.from({ length: emptySlotCount }, (_emptySlot, index) => (
            <div
              aria-hidden="true"
              className="h-[68px] w-[68px] rounded-[5px] border-2 border-[rgba(118,107,73,0.45)] bg-[linear-gradient(180deg,rgba(12,12,10,0.72),rgba(0,0,0,0.82))] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.7)]"
              key={`empty-${index}`}
            />
          ))}
          {visibleItems.length === 0 ? (
            <p className="col-span-full py-6 text-center text-sm font-extrabold text-text-muted">
              No items match the selected filters.
            </p>
          ) : null}
        </div>
      </div>

      {transactionItem ? (
        <Panel
          as="section"
          className="h-[250px] min-w-0 max-w-full grid-cols-[92px_minmax(0,1fr)] content-stretch gap-3 overflow-hidden border-border bg-panel-muted p-3"
          data-testid="map_panel_general_store_price"
        >
          {shopFilters}
          <div className="themed-scrollbar grid min-h-0 min-w-0 content-start gap-3 overflow-y-auto pr-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-foreground">{transactionItem.name}</p>
                <p className="text-xs text-text-muted">
                  {transactionMode === "buy" ? "Buy price" : "Sell price"}:{" "}
                  {transactionItem.price.toLocaleString()} Penya each
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">Total</p>
                <strong className="shrink-0 text-base font-black text-[#f4cf67]">
                  {totalPrice.toLocaleString()} Penya
                </strong>
              </div>
            </div>
            <label className="grid gap-1 text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
              Quantity
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem_auto] gap-1">
                <button
                  aria-label="Decrease quantity"
                  className="rounded-control border-2 border-border bg-panel text-lg text-foreground disabled:opacity-50"
                  disabled={quantity <= 1 || isPurchasing}
                  onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}
                  type="button"
                >
                  −
                </button>
                <input
                  aria-label="Purchase quantity"
                  className="h-11 min-w-0 rounded-control border-2 border-border bg-black/50 px-2 text-center text-foreground outline-none focus:border-primary"
                  disabled={isPurchasing}
                  max={maximumQuantity}
                  min={1}
                  onChange={(event) => {
                    const nextQuantity = event.currentTarget.valueAsNumber;

                    setQuantity(
                      Number.isFinite(nextQuantity)
                        ? Math.min(maximumQuantity, Math.max(1, Math.trunc(nextQuantity)))
                        : 1
                    );
                  }}
                  style={{ fontSize: "1.5rem", fontWeight: 900, lineHeight: 1 }}
                  type="number"
                  value={quantity}
                />
                <button
                  aria-label="Increase quantity"
                  className="rounded-control border-2 border-border bg-panel text-lg text-foreground disabled:opacity-50"
                  disabled={quantity >= maximumQuantity || isPurchasing}
                  onClick={() =>
                    setQuantity((currentQuantity) => Math.min(maximumQuantity, currentQuantity + 1))
                  }
                  type="button"
                >
                  +
                </button>
                <button
                  className="rounded-control border-2 border-border bg-panel px-2 text-[0.65rem] font-black uppercase text-foreground disabled:opacity-50"
                  disabled={quantity >= maximumQuantity || isPurchasing}
                  onClick={() => setQuantity(maximumQuantity)}
                  type="button"
                >
                  Max
                </button>
              </div>
              <span className="normal-case tracking-normal">Maximum quantity: {maximumQuantity}</span>
            </label>
            <Button
              aria-label={`${transactionMode === "buy" ? "Buy" : "Sell"} ${quantity} ${transactionItem.name}`}
              className="w-full"
              disabled={
                isPurchasing ||
                !canAffordSelectedItem ||
                (transactionMode === "buy" ? !onBuyItem : !onSellItem)
              }
              onClick={submitTransaction}
              type="button"
            >
              {isPurchasing
                ? transactionMode === "buy"
                  ? "Buying..."
                  : "Selling..."
                : !canAffordSelectedItem
                  ? transactionMode === "buy"
                    ? "Not enough Penya"
                    : "Cannot sell"
                  : `${transactionMode === "buy" ? "Buy" : "Sell"} ${quantity.toLocaleString()}`}
            </Button>
            {purchaseError ? <ErrorMessage message={purchaseError} /> : null}
          </div>
        </Panel>
      ) : (
        <Panel
          as="section"
          className="h-[250px] grid-cols-[92px_minmax(0,1fr)] content-stretch gap-3 border-border bg-panel-muted p-3"
          data-testid="map_panel_general_store_price"
        >
          {shopFilters}
          <div className="grid place-items-center">
            <p className="text-center text-sm font-extrabold text-text-muted">
              Clear a filter to select an item.
            </p>
          </div>
        </Panel>
      )}
      {characterInventory ? (
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
            {Array.from({ length: characterInventory.size }, (_slot, slotIndex) => {
              const stack = characterInventory.items.find((item) => item.slotIndex === slotIndex);
              const saleItem = stack ? toSellItem(stack, itemsById) : undefined;

              return saleItem && stack ? (
                <ShopInventorySlot
                  isSelected={transactionMode === "sell" && selectedInventorySlotIndex === slotIndex}
                  key={slotIndex}
                  onHideDetails={() => setInspectedItem(null)}
                  onInspect={(event) => inspectItem(event, saleItem)}
                  onSelect={() => {
                    setTransactionMode("sell");
                    setSelectedInventorySlotIndex(slotIndex);
                    setQuantity(1);
                    setPurchaseError("");
                  }}
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
      ) : null}
      {inspectedItem ? <ShopItemDetailsOverlay {...inspectedItem} /> : null}
    </Panel>
  );
}

function ShopFilterCheckbox({
  checked,
  disabled,
  label,
  onChange
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input
        checked={checked}
        className="h-4 w-4 accent-primary"
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function meetsShopFilters(
  item: ShopInventoryItem,
  {
    characterLevel,
    characterSex,
    filterByLevel,
    filterBySex
  }: {
    characterLevel?: number;
    characterSex?: "female" | "male";
    filterByLevel: boolean;
    filterBySex: boolean;
  }
) {
  const meetsSex = !filterBySex || !item.sex || item.sex.toLowerCase() === characterSex;
  const meetsLevel = !filterByLevel || item.level === null || item.level <= (characterLevel ?? 0);
  return meetsSex && meetsLevel;
}
