import type { CharacterInventory } from "@/lib/api";
import type { MapRegionId } from "@/lib/mapMonsterMarkers";

export type TravelMethod = "flying" | "blinkwing";

export type MapTravelDestination = {
  id: MapRegionId;
  label: string;
  requiredFlyingTier: number;
  blinkwing?: {
    id: string;
    name: string;
  };
};

const flyingItemTierById: Record<string, number> = {
  "8507": 1,
  "7182": 1,
  "2128": 2,
  "4482": 2,
  "3258": 3,
  "6333": 3,
  "7336": 4,
  "4715": 4
};

export const mapTravelDestinations: Record<MapRegionId, MapTravelDestination> = {
  flaris: {
    id: "flaris",
    label: "Flaris",
    requiredFlyingTier: 1,
    blinkwing: { id: "8815", name: "Blinkwing of Flaris" }
  },
  saint: {
    id: "saint",
    label: "Saint Morning",
    requiredFlyingTier: 1,
    blinkwing: { id: "6617", name: "Blinkwing of Saint Morning" }
  },
  rhisis: { id: "rhisis", label: "Rhisis", requiredFlyingTier: 1 },
  darkon12: {
    id: "darkon12",
    label: "Darkon 1 and 2",
    requiredFlyingTier: 2,
    blinkwing: { id: "4602", name: "Blinkwing of Darkon" }
  },
  darkon3: { id: "darkon3", label: "Darkon 3", requiredFlyingTier: 2 },
  shaduwar: { id: "shaduwar", label: "Shaduwar", requiredFlyingTier: 3 },
  valley: { id: "valley", label: "Valley of the Risen", requiredFlyingTier: 3 },
  kaillun: {
    id: "kaillun",
    label: "Eillun",
    requiredFlyingTier: 4,
    blinkwing: { id: "47839", name: "Blinkwing of Eillun" }
  },
  bahara: { id: "bahara", label: "Bahara", requiredFlyingTier: 4 }
};

export function getFlyingItemTier(itemId?: string | null) {
  return itemId ? (flyingItemTierById[itemId] ?? 0) : 0;
}

export function getInventoryItemQuantity(inventory: CharacterInventory | undefined, itemId: string) {
  return (
    inventory?.items.reduce((quantity, item) => quantity + (item.itemId === itemId ? item.quantity : 0), 0) ??
    0
  );
}

export function getRegionIdForLocation(location: string) {
  const normalizedLocation = location.trim().toLowerCase();

  return Object.values(mapTravelDestinations).find(
    (destination) => destination.label.toLowerCase() === normalizedLocation
  )?.id;
}
