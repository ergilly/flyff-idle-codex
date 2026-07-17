"use client";

import { useState } from "react";
import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import type { CharacterInventory, ItemMetadata } from "@/lib/api";
import {
  getFlyingItemTier,
  getInventoryItemQuantity,
  type MapTravelDestination,
  type TravelMethod
} from "@/lib/mapTravel";

type MapTravelDialogProps = {
  destination: MapTravelDestination;
  equippedFlyingItemId?: string | null;
  inventory?: CharacterInventory;
  itemsById?: Record<string, ItemMetadata>;
  onCancel: () => void;
  onTravel: (method: TravelMethod) => Promise<void>;
};

export function MapTravelDialog({
  destination,
  equippedFlyingItemId,
  inventory,
  itemsById = {},
  onCancel,
  onTravel
}: MapTravelDialogProps) {
  const [error, setError] = useState("");
  const [pendingMethod, setPendingMethod] = useState<TravelMethod | null>(null);
  const flyingTier = getFlyingItemTier(equippedFlyingItemId);
  const canFly = flyingTier >= destination.requiredFlyingTier;
  const flyingItemName = equippedFlyingItemId
    ? (itemsById[equippedFlyingItemId]?.name ?? "equipped flying item")
    : "equipped flying item";
  const blinkwingQuantity = destination.blinkwing
    ? getInventoryItemQuantity(inventory, destination.blinkwing.id)
    : 0;

  async function handleTravel(method: TravelMethod) {
    setError("");
    setPendingMethod(method);

    try {
      await onTravel(method);
    } catch (travelError) {
      setError(travelError instanceof Error ? travelError.message : "Unable to travel");
      setPendingMethod(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] grid place-items-center bg-[rgba(8,12,18,0.78)] p-[18px]"
      data-testid="map_travel_div_overlay"
      role="presentation"
    >
      <section
        aria-describedby="map-travel-description"
        aria-labelledby="map-travel-title"
        aria-modal="true"
        className="grid w-full max-w-[460px] gap-4 rounded-card border-2 border-border bg-panel-shell p-6 shadow-shell"
        data-testid="map_travel_section_dialog"
        role="dialog"
      >
        <div className="grid gap-2">
          <h2 className="m-0 text-[1.2rem]" id="map-travel-title">
            Travel to {destination.label}?
          </h2>
          <MutedText id="map-travel-description">
            Choose an available travel method. Blinkwings are consumed when used.
          </MutedText>
        </div>

        <div className="grid gap-2 rounded-control border-2 border-border bg-panel-muted p-3 text-sm">
          <strong className={canFly ? "text-[#8ee89a]" : "text-[#ff8a8a]"}>
            Flying:{" "}
            {canFly
              ? `${flyingItemName} can reach this area`
              : `Tier ${destination.requiredFlyingTier} required`}
          </strong>
          {destination.blinkwing ? (
            <strong className={blinkwingQuantity > 0 ? "text-[#8ee89a]" : "text-[#ff8a8a]"}>
              {destination.blinkwing.name}: {blinkwingQuantity} available
            </strong>
          ) : (
            <strong className="text-text-muted">No Blinkwing travels to this area</strong>
          )}
        </div>

        {error ? <ErrorMessage message={error} testId="map_travel_error" /> : null}

        <Actions className="!grid w-full grid-flow-col auto-cols-fr max-[560px]:grid-flow-row max-[560px]:auto-cols-auto [&>button]:min-w-0 [&>button]:w-full">
          <Button
            data-testid="map_travel_button_cancel"
            disabled={pendingMethod !== null}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            data-testid="map_travel_button_flying"
            disabled={!canFly || pendingMethod !== null}
            onClick={() => void handleTravel("flying")}
            type="button"
          >
            {pendingMethod === "flying" ? "Travelling..." : "Fly"}
          </Button>
          {destination.blinkwing ? (
            <Button
              data-testid="map_travel_button_blinkwing"
              disabled={blinkwingQuantity < 1 || pendingMethod !== null}
              onClick={() => void handleTravel("blinkwing")}
              type="button"
            >
              {pendingMethod === "blinkwing" ? "Travelling..." : `Use Blinkwing`}
            </Button>
          ) : null}
        </Actions>
      </section>
    </div>
  );
}
