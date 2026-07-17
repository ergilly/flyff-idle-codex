export const travelDestinationIds = [
  "flaris",
  "saint",
  "rhisis",
  "darkon12",
  "darkon3",
  "shaduwar",
  "valley",
  "kaillun",
  "bahara"
] as const;

export type TravelDestinationId = (typeof travelDestinationIds)[number];
export type TravelMethod = "flying" | "blinkwing";

export type TravelDestination = {
  id: TravelDestinationId;
  label: string;
  requiredFlyingTier: number;
  blinkwing?: {
    id: string;
    name: string;
  };
};

export const travelDestinations: Record<TravelDestinationId, TravelDestination> = {
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
