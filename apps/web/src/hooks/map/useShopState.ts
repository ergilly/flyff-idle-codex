"use client";

import { type FocusEvent, type MouseEvent, useState } from "react";
import type { CharacterInventory, ItemMetadata } from "@/lib/api/types";
import { meetsShopFilters } from "@/lib/shopFilters";
import { toSellItem } from "@/lib/shopInventory";
import type { ShopInventoryItem, ShopMerchant } from "@/lib/townShops";

export type ShopTransactionMode = "buy" | "sell";

type UseShopStateOptions = {
  characterInventory?: CharacterInventory;
  characterJob?: string;
  characterLevel?: number;
  characterPenya?: number;
  characterSex?: "female" | "male";
  itemsById: Record<string, ItemMetadata>;
  merchants: ShopMerchant[];
  onBuyItem?: (itemId: string, quantity: number) => Promise<void>;
  onSellItem?: (slotIndex: number, quantity: number) => Promise<void>;
};

export function useShopState({
  characterInventory,
  characterJob,
  characterLevel,
  characterPenya,
  characterSex,
  itemsById,
  merchants,
  onBuyItem,
  onSellItem
}: UseShopStateOptions) {
  const firstMerchant = merchants[0];
  const firstTab = firstMerchant.tabs[0];
  const [activeMerchantId, setActiveMerchantId] = useState(firstMerchant.id);
  const [activeTabId, setActiveTabId] = useState(firstTab.id);
  const [selectedItemId, setSelectedItemId] = useState(firstTab.items[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [transactionError, setTransactionError] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [filterByLevel, setFilterByLevel] = useState(false);
  const [filterByClass, setFilterByClass] = useState(false);
  const [filterBySex, setFilterBySex] = useState(false);
  const [transactionMode, setTransactionMode] = useState<ShopTransactionMode>("buy");
  const [selectedInventorySlotIndex, setSelectedInventorySlotIndex] = useState<number | null>(null);
  const [inspectedItem, setInspectedItem] = useState<{
    item: ShopInventoryItem;
    rect: DOMRect;
  } | null>(null);
  const activeMerchant = merchants.find((merchant) => merchant.id === activeMerchantId) ?? firstMerchant;
  const activeTab = activeMerchant.tabs.find((tab) => tab.id === activeTabId) ?? activeMerchant.tabs[0];
  const filterOptions = {
    characterLevel,
    characterJob,
    characterSex,
    filterByClass,
    filterByLevel,
    filterBySex
  };
  const visibleItems = activeTab.items.filter((item) => meetsShopFilters(item, filterOptions));
  const selectedItem = visibleItems.find((item) => item.id === selectedItemId) ?? visibleItems[0];
  const selectedInventoryStack = characterInventory?.items.find(
    (item) => item.slotIndex === selectedInventorySlotIndex
  );
  const selectedSellItem = selectedInventoryStack ? toSellItem(selectedInventoryStack, itemsById) : undefined;
  const transactionItem = transactionMode === "sell" ? selectedSellItem : selectedItem;
  const maximumQuantity = Math.max(
    1,
    transactionMode === "sell" ? (selectedInventoryStack?.quantity ?? 1) : (selectedItem?.maxStack ?? 1)
  );
  const totalPrice = transactionItem ? transactionItem.price * quantity : 0;
  const canAffordSelectedItem =
    transactionItem !== undefined &&
    transactionItem.price > 0 &&
    (transactionMode === "sell" || characterPenya === undefined || characterPenya >= totalPrice);

  function resetSelection(itemId: string) {
    setSelectedItemId(itemId);
    setQuantity(1);
    setTransactionError("");
  }

  function selectTab(tabId: string) {
    const nextTab = activeMerchant.tabs.find((tab) => tab.id === tabId);
    if (!nextTab) return;

    setActiveTabId(tabId);
    resetSelection(nextTab.items.find((item) => meetsShopFilters(item, filterOptions))?.id ?? "");
  }

  function selectMerchant(merchantId: string) {
    const nextMerchant = merchants.find((merchant) => merchant.id === merchantId);
    const nextTab = nextMerchant?.tabs[0];
    if (!nextMerchant || !nextTab) return;

    setActiveMerchantId(merchantId);
    setActiveTabId(nextTab.id);
    resetSelection(nextTab.items.find((item) => meetsShopFilters(item, filterOptions))?.id ?? "");
  }

  function selectBuyItem(itemId: string) {
    setTransactionMode("buy");
    resetSelection(itemId);
  }

  function selectSellItem(slotIndex: number) {
    setTransactionMode("sell");
    setSelectedInventorySlotIndex(slotIndex);
    setQuantity(1);
    setTransactionError("");
  }

  function updateFilter(filter: "class" | "level" | "sex", checked: boolean) {
    const nextOptions = {
      ...filterOptions,
      filterByClass: filter === "class" ? checked : filterByClass,
      filterByLevel: filter === "level" ? checked : filterByLevel,
      filterBySex: filter === "sex" ? checked : filterBySex
    };
    const nextItem = activeTab.items.find((item) => meetsShopFilters(item, nextOptions));

    if (filter === "class") setFilterByClass(checked);
    else if (filter === "level") setFilterByLevel(checked);
    else setFilterBySex(checked);
    resetSelection(nextItem?.id ?? "");
    setInspectedItem(null);
  }

  function inspectItem(
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: ShopInventoryItem
  ) {
    setInspectedItem({ item, rect: event.currentTarget.getBoundingClientRect() });
  }

  async function submitTransaction() {
    if (!transactionItem || !canAffordSelectedItem) return;

    setIsTransacting(true);
    setTransactionError("");
    try {
      if (transactionMode === "sell" && selectedInventoryStack && onSellItem) {
        await onSellItem(selectedInventoryStack.slotIndex, quantity);
      } else if (transactionMode === "buy" && selectedItem && onBuyItem) {
        await onBuyItem(selectedItem.id, quantity);
      }
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Unable to complete transaction");
    } finally {
      setIsTransacting(false);
    }
  }

  return {
    activeMerchant,
    activeTab,
    canAffordSelectedItem,
    filterByClass,
    filterByLevel,
    filterBySex,
    inspectedItem,
    isTransacting,
    maximumQuantity,
    quantity,
    selectBuyItem,
    selectMerchant,
    selectSellItem,
    selectTab,
    selectedInventorySlotIndex,
    setInspectedItem,
    setQuantity,
    submitTransaction,
    totalPrice,
    transactionError,
    transactionItem,
    transactionMode,
    updateFilter,
    visibleItems,
    inspectItem
  };
}
