"use client";

import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Panel } from "@/components/atoms/Panel";
import { BankInventoryGrid } from "@/components/molecules/map/BankInventoryGrid";
import { ShopItemDetailsOverlay } from "@/components/organisms/map/ShopItemDetailsOverlay";
import { useBankState } from "@/hooks/map/useBankState";
import { useBankItemMetadata } from "@/hooks/map/useBankItemMetadata";
import type { Bank, CharacterInventory, ItemMetadata } from "@/lib/api/types";
import type { ShopInventoryItem } from "@/lib/townShops";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type FocusEvent, type MouseEvent, useState } from "react";

type BankDirection = "deposit" | "withdraw";

export function BankPanel({
  characterInventory,
  characterPenya,
  itemsById,
  onLoad,
  onTransferAllItems,
  onTransferItem,
  onTransferPenya
}: {
  characterInventory: CharacterInventory;
  characterPenya: number;
  itemsById: Record<string, ItemMetadata>;
  onLoad: () => Promise<Bank>;
  onTransferAllItems: (direction: BankDirection) => Promise<Bank>;
  onTransferItem: (direction: BankDirection, slotIndex: number) => Promise<Bank>;
  onTransferPenya: (direction: BankDirection, amount: number | "all") => Promise<Bank>;
}) {
  const state = useBankState({ onLoad, onTransferAllItems, onTransferItem, onTransferPenya });
  const bankMetadata = useBankItemMetadata(state.bank, itemsById);
  const [inspectedItem, setInspectedItem] = useState<{
    item: ShopInventoryItem;
    rect: DOMRect;
  } | null>(null);
  const inspect = (
    event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: ShopInventoryItem
  ) => {
    setInspectedItem({ item, rect: event.currentTarget.getBoundingClientRect() });
  };

  if (!state.bank) {
    return (
      <Panel as="section" className="content-start gap-2 bg-panel-muted p-4">
        <h3 className="text-lg font-black">Shared Bank</h3>
        {state.error ? <ErrorMessage message={state.error} /> : <p>Loading bank...</p>}
      </Panel>
    );
  }

  return (
    <section className="grid min-w-0 gap-3" data-testid="map_section_bank">
      <header>
        <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">Public Office</p>
        <h3 className="text-lg font-black text-foreground">Shared Bank</h3>
      </header>

      <Panel as="section" className="min-w-0 content-start gap-2 border-border bg-panel-muted p-3">
        <InventoryHeading eyebrow="Bank storage" penya={state.bank.penya} title="Bank Inventory" />
        <BankInventoryGrid
          inventory={{ size: state.bank.size, items: state.bank.items }}
          itemsById={bankMetadata.itemsById}
          label="Shared bank inventory"
          onHideDetails={() => setInspectedItem(null)}
          onInspect={inspect}
          onSelect={state.setSelectedBankSlot}
          selectedSlotIndex={state.selectedBankSlot}
        />
      </Panel>

      <div
        className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2"
        aria-label="Bank transfer controls"
      >
        <div className="grid gap-0.5">
          <span className="text-[0.6rem] font-black uppercase tracking-wide text-text-muted">Items</span>
          <div className="grid grid-cols-4 gap-1.5" aria-label="Item transfer controls" role="group">
            <TransferButton
              direction="down"
              disabled={state.isPending || state.bank.items.length === 0}
              double
              label="Withdraw All"
              onClick={() => void state.transferAllItems("withdraw")}
              variant="secondary"
            />
            <TransferButton
              direction="down"
              disabled={state.isPending || state.selectedBankSlot === null}
              label="Withdraw"
              onClick={() => {
                if (state.selectedBankSlot !== null) {
                  void state.transferItem("withdraw", state.selectedBankSlot);
                }
              }}
            />
            <TransferButton
              direction="up"
              disabled={state.isPending || state.selectedCharacterSlot === null}
              label="Deposit"
              onClick={() => {
                if (state.selectedCharacterSlot !== null) {
                  void state.transferItem("deposit", state.selectedCharacterSlot);
                }
              }}
            />
            <TransferButton
              direction="up"
              disabled={state.isPending || characterInventory.items.length === 0}
              double
              label="Deposit All"
              onClick={() => void state.transferAllItems("deposit")}
              variant="secondary"
            />
          </div>
        </div>
        <div
          className="grid flex-none grid-cols-[128px_40px_40px] items-end gap-1.5"
          aria-label="Penya transfer controls"
          role="group"
        >
          <label className="grid min-w-0 gap-0.5">
            <span className="text-[0.6rem] font-black uppercase tracking-wide text-text-muted">Penya</span>
            <input
              aria-label="Penya amount"
              className="h-11 w-full rounded-control border-2 border-border bg-background px-2 text-foreground"
              min={1}
              onChange={(event) => state.setPenyaAmount(Number(event.target.value))}
              step={1}
              type="number"
              value={state.penyaAmount}
            />
          </label>
          <TransferButton
            direction="down"
            disabled={state.isPending || state.penyaAmount < 1}
            label="Withdraw Penya"
            onClick={() => void state.transferPenya("withdraw", state.penyaAmount)}
          />
          <TransferButton
            direction="up"
            disabled={state.isPending || state.penyaAmount < 1}
            label="Deposit Penya"
            onClick={() => void state.transferPenya("deposit", state.penyaAmount)}
          />
        </div>
      </div>

      <Panel as="section" className="min-w-0 content-start gap-2 border-border bg-panel-muted p-3">
        <InventoryHeading eyebrow="Deposit items" penya={characterPenya} title="Character Inventory" />
        <BankInventoryGrid
          inventory={characterInventory}
          itemsById={bankMetadata.itemsById}
          label="Character inventory for banking"
          onHideDetails={() => setInspectedItem(null)}
          onInspect={inspect}
          onSelect={state.setSelectedCharacterSlot}
          selectedSlotIndex={state.selectedCharacterSlot}
        />
      </Panel>

      {state.error ? <ErrorMessage message={state.error} /> : null}
      {bankMetadata.error ? <ErrorMessage message={bankMetadata.error} /> : null}
      {inspectedItem ? <ShopItemDetailsOverlay {...inspectedItem} showPrice={false} /> : null}
    </section>
  );
}

function InventoryHeading({ eyebrow, penya, title }: { eyebrow: string; penya: number; title: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">{eyebrow}</p>
        <h4 className="font-black">{title}</h4>
      </div>
      <div className="text-right">
        <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">Penya</p>
        <strong>{penya.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function TransferButton({
  direction,
  disabled,
  double = false,
  label,
  onClick,
  variant
}: {
  direction: "down" | "up";
  disabled: boolean;
  double?: boolean;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;

  return (
    <Button
      aria-label={label}
      className="inline-flex w-10 items-center justify-center px-1 text-center leading-none"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
      variant={variant}
    >
      <span
        aria-hidden="true"
        className={
          double ? "flex h-8 flex-col items-center justify-center -space-y-1.5" : "flex h-8 items-center"
        }
      >
        {Array.from({ length: double ? 2 : 1 }, (_chevron, index) => (
          <Icon className="h-4 w-4 shrink-0" key={index} strokeWidth={3} />
        ))}
      </span>
    </Button>
  );
}
