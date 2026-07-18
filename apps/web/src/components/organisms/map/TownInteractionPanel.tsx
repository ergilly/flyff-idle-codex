"use client";

import { GeneralStorePanel } from "@/components/organisms/map/GeneralStorePanel";
import { BankPanel } from "@/components/organisms/map/BankPanel";
import { useEffect, useState } from "react";
import { fetchTownShop } from "@/lib/api";
import { type Bank, type CharacterInventory, type ItemMetadata } from "@/lib/api/types";
import { type TownShop } from "@/lib/townShops";
import { type TownMapId, type TownMapLocation } from "@/lib/townMapLocations";

type TownInteractionPanelProps = {
  characterLevel?: number;
  characterJob?: string;
  characterInventory?: CharacterInventory;
  characterPenya?: number;
  characterSex?: "female" | "male";
  itemsById?: Record<string, ItemMetadata>;
  location: TownMapLocation | null;
  onBuyItem?: (townMapId: TownMapId, locationId: string, itemId: string, quantity: number) => Promise<void>;
  onLoadBank?: () => Promise<Bank>;
  onSellItem?: (slotIndex: number, quantity: number) => Promise<void>;
  onTransferAllBankItems?: (direction: "deposit" | "withdraw") => Promise<Bank>;
  onTransferBankItem?: (direction: "deposit" | "withdraw", slotIndex: number) => Promise<Bank>;
  onTransferBankPenya?: (direction: "deposit" | "withdraw", amount: number | "all") => Promise<Bank>;
  townMapId: TownMapId;
};

export function TownInteractionPanel({
  characterLevel,
  characterJob,
  characterInventory,
  characterPenya,
  characterSex,
  itemsById,
  location,
  onBuyItem,
  onLoadBank,
  onSellItem,
  onTransferAllBankItems,
  onTransferBankItem,
  onTransferBankPenya,
  townMapId
}: TownInteractionPanelProps) {
  const [shop, setShop] = useState<TownShop | null>(null);
  const [shopError, setShopError] = useState("");
  const [isLoadingShop, setIsLoadingShop] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setShop(null);
    setShopError("");
    setIsLoadingShop(false);

    if (!location || location.kind !== "shop") return;

    setIsLoadingShop(true);
    void fetchTownShop(townMapId, location.id)
      .then((loadedShop) => {
        if (isCurrent) setShop(loadedShop);
      })
      .catch((error: unknown) => {
        if (isCurrent) setShopError(error instanceof Error ? error.message : "Unable to load shop");
      })
      .finally(() => {
        if (isCurrent) setIsLoadingShop(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [location, townMapId]);

  if (!location) {
    return (
      <div
        className="grid min-h-40 place-items-center rounded-control border-2 border-dashed border-border bg-panel-muted p-6 text-center"
        data-testid="map_div_town_interaction_prompt"
      >
        <div>
          <p className="font-extrabold text-foreground">Select a town location</p>
          <p className="mt-1 text-sm text-text-muted">Choose a shop or NPC marker on the map.</p>
        </div>
      </div>
    );
  }

  if (location.kind === "shop" && shop) {
    return (
      <GeneralStorePanel
        characterLevel={characterLevel}
        characterJob={characterJob}
        characterInventory={characterInventory}
        characterPenya={characterPenya}
        characterSex={characterSex}
        itemsById={itemsById}
        iconSrc={location.iconSrc}
        key={shop.id}
        onBuyItem={(itemId, quantity) =>
          onBuyItem?.(townMapId, location.id, itemId, quantity) ?? Promise.resolve()
        }
        onSellItem={onSellItem}
        shopName={location.label}
        shopMerchants={shop.merchants}
        townName={getTownName(townMapId)}
      />
    );
  }

  if (
    location.id === "public-office" &&
    characterInventory &&
    characterPenya !== undefined &&
    itemsById &&
    onLoadBank &&
    onTransferAllBankItems &&
    onTransferBankItem &&
    onTransferBankPenya
  ) {
    return (
      <BankPanel
        characterInventory={characterInventory}
        characterPenya={characterPenya}
        itemsById={itemsById}
        key={`${townMapId}-public-office`}
        onLoad={onLoadBank}
        onTransferAllItems={onTransferAllBankItems}
        onTransferItem={onTransferBankItem}
        onTransferPenya={onTransferBankPenya}
      />
    );
  }

  if (location.kind === "shop" && isLoadingShop) {
    return <TownLocationState label={location.label} message="Loading inventory..." />;
  }

  if (location.kind === "shop" && shopError) {
    return <TownLocationState label={location.label} message={shopError} />;
  }

  return (
    <div
      className="grid gap-2 rounded-control border-2 border-primary bg-panel-muted p-4"
      data-testid="map_div_selected_town_location"
    >
      <span className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
        {location.kind}
      </span>
      <h3 className="text-lg font-black text-foreground">{location.label}</h3>
      <p className="text-sm text-text-muted">This {location.kind} is not available yet.</p>
    </div>
  );
}

function TownLocationState({ label, message }: { label: string; message: string }) {
  return (
    <div className="grid gap-2 rounded-control border-2 border-primary bg-panel-muted p-4">
      <span className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">shop</span>
      <h3 className="text-lg font-black text-foreground">{label}</h3>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function getTownName(townMapId: TownMapId) {
  return (
    {
      "darken-city": "Darken",
      eillun: "Eillun",
      "flarine-town": "Flarine",
      "sain-city": "Sain City"
    } satisfies Record<TownMapId, string>
  )[townMapId];
}
