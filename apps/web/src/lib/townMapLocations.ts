import authoredTownLocations from "../../../../content/authored/maps/town-locations.json";

export type TownMapId = "darken-city" | "eillun" | "flarine-town" | "sain-city";

export type TownMapLocation = {
  id: string;
  iconSrc: string;
  kind: "npc" | "shop";
  label: string;
  npcId?: number;
  x: number;
  y: number;
};

export const townMapLocations = authoredTownLocations.towns as Record<TownMapId, TownMapLocation[]>;
