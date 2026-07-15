"use client";

import Image from "next/image";
import { ChevronDown, Droplet, Flame, HeartPulse } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel } from "@/components/atoms/Panel";
import { SectionHeading } from "@/components/molecules/main-application/SectionHeading";
import { getItemIconUrl, type Character, type ItemMetadata } from "@/lib/api";
import { getConsumableCooldownMs, getRecoveryAbility } from "@/lib/battle/recovery";
import {
  type ConsumableCooldownState,
  type ConsumableResource,
  type RecoveryInventoryItem
} from "@/lib/battle/types";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

const recoverySlots: Array<{
  borderClassName: string;
  icon: typeof HeartPulse;
  label: string;
  resource: ConsumableResource;
}> = [
  { borderClassName: "border-[#ff6464]/78", icon: HeartPulse, label: "Food", resource: "hp" },
  { borderClassName: "border-[#5fb3ff]/78", icon: Droplet, label: "MP", resource: "mp" },
  { borderClassName: "border-[#64d875]/78", icon: Flame, label: "FP", resource: "fp" }
];

export function RecoveryPanel({
  consumableLoadout,
  cooldownRemainingByResource,
  itemsById,
  onEquipConsumableItem,
  onUseRecoveryItem,
  recoveryItemsByResource
}: {
  consumableLoadout: NonNullable<Character["consumableLoadout"]>;
  cooldownRemainingByResource: ConsumableCooldownState;
  itemsById: Record<string, ItemMetadata>;
  onEquipConsumableItem?: (resource: ConsumableResource, slotIndex: number | null) => void;
  onUseRecoveryItem: (
    resource: ConsumableResource,
    recoveryItem: RecoveryInventoryItem | null
  ) => Promise<void> | void;
  recoveryItemsByResource: Record<ConsumableResource, RecoveryInventoryItem[]>;
}) {
  const [openRecoveryResource, setOpenRecoveryResource] = useState<ConsumableResource | null>(null);

  useEffect(() => {
    if (
      openRecoveryResource &&
      recoveryItemsByResource[openRecoveryResource].length === 0 &&
      !consumableLoadout[openRecoveryResource]
    ) {
      setOpenRecoveryResource(null);
    }
  }, [consumableLoadout, openRecoveryResource, recoveryItemsByResource]);

  return (
    <Panel as="section" className="min-w-0 content-start gap-3" data-testid="battle_panel_food">
      <SectionHeading eyebrow="Recovery" testId="battle_heading_food" />
      <div
        className="grid grid-cols-3 gap-2 rounded-control border border-[rgba(138,116,65,0.58)] bg-black/24 p-2"
        data-testid="battle_div_food_slots"
      >
        {recoverySlots.map((slot) => {
          const Icon = slot.icon;
          const items = recoveryItemsByResource[slot.resource];
          const selectedConsumable = consumableLoadout[slot.resource];
          const hasEquippedConsumable = Boolean(selectedConsumable);
          const selectedItem = selectedConsumable ? itemsById[selectedConsumable.itemId] : null;
          const selectedEntry =
            selectedConsumable && selectedItem
              ? {
                  inventoryItem: {
                    itemId: selectedConsumable.itemId,
                    quantity: selectedConsumable.quantity,
                    slotIndex: -1
                  },
                  item: selectedItem,
                  recoverAmount: getRecoveryAbility(selectedItem, slot.resource)?.add ?? null
                }
              : null;
          const menuLabel = `${slot.label} recovery item`;
          const isOpen = openRecoveryResource === slot.resource;
          const cooldownRemainingMs = cooldownRemainingByResource[slot.resource];
          const isCoolingDown = cooldownRemainingMs > 0;
          const cooldownRemainingSeconds = Math.ceil(cooldownRemainingMs / 1000);
          const cooldownMs = selectedEntry ? getConsumableCooldownMs(selectedEntry.item) : 0;
          const cooldownRemainingPercent =
            cooldownMs > 0 ? Math.min(100, Math.max(0, (cooldownRemainingMs / cooldownMs) * 100)) : 0;
          const cooldownElapsedPercent = 100 - cooldownRemainingPercent;
          const canOpenMenu = items.length > 0 || hasEquippedConsumable;

          return (
            <div
              className="relative grid min-w-0 gap-1"
              data-testid={`battle_div_food_slot_${slot.resource}`}
              key={slot.resource}
            >
              <div
                className={cx(
                  "grid h-[46px] w-full min-w-0 grid-cols-[minmax(0,1fr)_18px] overflow-hidden rounded-[4px] border-2 bg-black/42 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-[#f5d451]/55 disabled:cursor-not-allowed disabled:opacity-60",
                  slot.borderClassName,
                  isOpen ? "bg-[rgba(245,212,81,0.12)]" : ""
                )}
                data-testid={`battle_div_food_control_${slot.resource}`}
              >
                <button
                  aria-label={`Use ${slot.label} recovery item`}
                  className="relative grid min-w-0 place-items-center p-1 disabled:cursor-not-allowed"
                  data-testid={`battle_button_food_${slot.resource}`}
                  disabled={!selectedEntry || isCoolingDown}
                  onClick={() => onUseRecoveryItem(slot.resource, selectedEntry ?? null)}
                  title={
                    isCoolingDown
                      ? `${selectedEntry?.item.name ?? slot.label} ready in ${cooldownRemainingSeconds}s`
                      : (selectedEntry?.item.name ?? slot.label)
                  }
                  type="button"
                >
                  <span
                    className="grid h-9 w-9 place-items-center"
                    data-testid={`battle_span_food_icon_${slot.resource}`}
                  >
                    {selectedEntry?.item.icon ? (
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="h-9 w-9 object-contain"
                        height={36}
                        src={getItemIconUrl(selectedEntry.item.icon)}
                        unoptimized
                        width={36}
                      />
                    ) : (
                      <Icon aria-hidden="true" className="text-text-muted" size={20} />
                    )}
                  </span>
                  {selectedEntry ? (
                    <>
                      <span
                        className="absolute bottom-0.5 right-0.5 rounded-[3px] border border-black/60 bg-black/82 px-1 text-[0.72rem] font-black leading-4 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                        data-testid={`battle_span_food_quantity_${slot.resource}`}
                      >
                        x{selectedEntry.inventoryItem.quantity.toLocaleString()}
                      </span>
                      {selectedEntry.recoverAmount !== null ? (
                        <span
                          className="absolute left-0.5 top-0.5 px-1 text-[0.72rem] font-black leading-4 text-primary drop-shadow-[0_1px_1px_rgba(0,0,0,0.92)]"
                          data-testid={`battle_span_food_recovery_${slot.resource}`}
                        >
                          +{selectedEntry.recoverAmount.toLocaleString()}
                        </span>
                      ) : null}
                      {isCoolingDown ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-[3px] opacity-95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
                            data-testid={`battle_span_food_cooldown_clock_${slot.resource}`}
                            style={{
                              background: `conic-gradient(from 0deg, rgba(6,6,6,0.2) 0% ${cooldownElapsedPercent}%, rgba(6,6,6,0.82) ${cooldownElapsedPercent}% 100%)`
                            }}
                          />
                          <span
                            className="absolute inset-0 grid place-items-center rounded-[3px] bg-black/22 text-[0.78rem] font-black text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                            data-testid={`battle_span_food_cooldown_${slot.resource}`}
                          >
                            {cooldownRemainingSeconds}s
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </button>
                <button
                  aria-expanded={isOpen}
                  aria-label={menuLabel}
                  className="grid h-full place-items-center border-l border-white/10 bg-black/26 transition-colors hover:bg-[rgba(245,212,81,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid={`battle_button_food_menu_${slot.resource}`}
                  disabled={!canOpenMenu}
                  onClick={() =>
                    setOpenRecoveryResource((current) => (current === slot.resource ? null : slot.resource))
                  }
                  type="button"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={cx("text-text-muted transition-transform", isOpen ? "rotate-180" : "")}
                    size={16}
                  />
                </button>
              </div>
              {isOpen ? (
                <div
                  aria-label={`${slot.label} recovery options`}
                  className="absolute left-0 top-[52px] z-20 grid max-h-[220px] w-[min(240px,calc(100vw-2rem))] gap-1 overflow-y-auto rounded-control border border-[rgba(226,179,63,0.58)] bg-[linear-gradient(180deg,rgba(31,29,22,0.98),rgba(5,6,5,0.98))] p-2 shadow-[0_16px_30px_rgba(0,0,0,0.46)] [scrollbar-color:rgba(245,212,81,0.55)_rgba(0,0,0,0.28)] [scrollbar-width:thin]"
                  data-testid={`battle_div_food_menu_${slot.resource}`}
                  role="menu"
                >
                  {hasEquippedConsumable ? (
                    <button
                      className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-[4px] border border-transparent bg-black/20 p-2 text-left text-xs font-bold transition-colors hover:border-primary hover:bg-[rgba(245,212,81,0.1)]"
                      data-testid={`battle_button_food_option_${slot.resource}_none`}
                      onClick={() => {
                        onEquipConsumableItem?.(slot.resource, null);
                        setOpenRecoveryResource(null);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span className="grid h-[34px] w-[34px] place-items-center rounded-[4px] border border-[rgba(138,116,65,0.58)] bg-black/38">
                        <Icon aria-hidden="true" className="text-text-muted" size={18} />
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <strong className="min-w-0 truncate text-foreground">None</strong>
                        <span className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted">
                          Unequip
                        </span>
                      </span>
                    </button>
                  ) : null}
                  {items.map((entry) => {
                    const isSelected = entry.item.id === selectedEntry?.item.id;

                    return (
                      <button
                        className={cx(
                          "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-[4px] border border-transparent bg-black/20 p-2 text-left text-xs font-bold transition-colors hover:border-primary hover:bg-[rgba(245,212,81,0.1)]",
                          isSelected ? "border-[#f5d451]/60 bg-[rgba(245,212,81,0.14)]" : ""
                        )}
                        data-testid={`battle_button_food_option_${slot.resource}_${getTestIdSegment(entry.item.name)}`}
                        key={`${slot.resource}-${entry.inventoryItem.slotIndex}`}
                        onClick={() => {
                          onEquipConsumableItem?.(slot.resource, entry.inventoryItem.slotIndex);
                          setOpenRecoveryResource(null);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        <span className="grid h-[34px] w-[34px] place-items-center rounded-[4px] border border-[rgba(138,116,65,0.58)] bg-black/38">
                          {entry.item.icon ? (
                            <Image
                              alt=""
                              aria-hidden="true"
                              className="h-8 w-8 object-contain"
                              height={32}
                              src={getItemIconUrl(entry.item.icon)}
                              unoptimized
                              width={32}
                            />
                          ) : (
                            <Icon aria-hidden="true" className="text-text-muted" size={18} />
                          )}
                        </span>
                        <span className="grid min-w-0 gap-0.5">
                          <strong className="min-w-0 truncate text-foreground">{entry.item.name}</strong>
                          <span className="text-[0.68rem] font-black uppercase tracking-wide text-text-muted">
                            x{entry.inventoryItem.quantity}
                            {entry.recoverAmount !== null ? ` / +${entry.recoverAmount}` : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
