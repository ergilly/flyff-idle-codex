"use client";

import Image from "next/image";
import { Panel } from "@/components/atoms/Panel";
import { ShopInventoryGrid } from "@/components/molecules/map/ShopInventoryGrid";
import { ShopDepartmentTabs, ShopMerchantTabs } from "@/components/molecules/map/ShopNavigation";
import { ShopTransactionPanel } from "@/components/molecules/map/ShopTransactionPanel";
import { CharacterShopInventory } from "@/components/organisms/map/CharacterShopInventory";
import { ShopItemDetailsOverlay } from "@/components/organisms/map/ShopItemDetailsOverlay";
import { useShopState } from "@/hooks/map/useShopState";
import type { CharacterInventory, ItemMetadata } from "@/lib/api/types";
import { flarineGeneralStoreTabs, type ShopInventoryTab, type ShopMerchant } from "@/lib/townShops";

type GeneralStorePanelProps = {
  characterLevel?: number;
  characterJob?: string;
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

export function GeneralStorePanel({
  characterLevel,
  characterJob,
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
  const shop = useShopState({
    characterInventory,
    characterJob,
    characterLevel,
    characterPenya,
    characterSex,
    itemsById,
    merchants,
    onBuyItem,
    onSellItem
  });

  return (
    <Panel
      as="section"
      className="min-h-0 min-w-0 max-w-full content-start gap-3 overflow-hidden border-primary p-3"
      data-testid="map_section_general_store"
    >
      <ShopHeader iconSrc={iconSrc} shopName={shopName} townName={townName} />
      <ShopMerchantTabs
        activeMerchant={shop.activeMerchant}
        merchants={merchants}
        onSelect={shop.selectMerchant}
        shopName={shopName}
      />
      <div className="grid min-w-0 max-w-full gap-2 overflow-hidden rounded-control border-2 border-border bg-black/35 p-2">
        <ShopDepartmentTabs
          activeTab={shop.activeTab}
          onSelect={shop.selectTab}
          shopName={shopName}
          tabs={shop.activeMerchant.tabs}
        />
        <ShopInventoryGrid
          activeTab={shop.activeTab}
          items={shop.visibleItems}
          onHideDetails={() => shop.setInspectedItem(null)}
          onInspect={shop.inspectItem}
          onSelect={shop.selectBuyItem}
          selectedItemId={shop.transactionMode === "buy" ? shop.transactionItem?.id : undefined}
        />
      </div>
      <ShopTransactionPanel
        canAfford={shop.canAffordSelectedItem}
        characterLevel={characterLevel}
        characterJob={characterJob}
        characterSex={characterSex}
        error={shop.transactionError}
        filterByClass={shop.filterByClass}
        filterByLevel={shop.filterByLevel}
        filterBySex={shop.filterBySex}
        isTransacting={shop.isTransacting}
        maximumQuantity={shop.maximumQuantity}
        mode={shop.transactionMode}
        onFilterChange={shop.updateFilter}
        onQuantityChange={shop.setQuantity}
        onSubmit={shop.submitTransaction}
        quantity={shop.quantity}
        submitEnabled={shop.transactionMode === "buy" ? Boolean(onBuyItem) : Boolean(onSellItem)}
        totalPrice={shop.totalPrice}
        transactionItem={shop.transactionItem}
      />
      {characterInventory ? (
        <CharacterShopInventory
          inventory={characterInventory}
          itemsById={itemsById}
          onHideDetails={() => shop.setInspectedItem(null)}
          onInspect={shop.inspectItem}
          onSelect={shop.selectSellItem}
          selectedSlotIndex={shop.transactionMode === "sell" ? shop.selectedInventorySlotIndex : null}
        />
      ) : null}
      {shop.inspectedItem ? <ShopItemDetailsOverlay {...shop.inspectedItem} /> : null}
    </Panel>
  );
}

function ShopHeader({
  iconSrc,
  shopName,
  townName
}: {
  iconSrc: string;
  shopName: string;
  townName: string;
}) {
  return (
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
  );
}
