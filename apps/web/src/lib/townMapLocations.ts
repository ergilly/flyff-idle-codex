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

export type TownMapLocationTarget = TownMapLocation & {
  townMapId: TownMapId;
};

export const townMapLocations = authoredTownLocations.towns as Record<TownMapId, TownMapLocation[]>;

export function findTownLocationByNpcId(npcId: number): TownMapLocationTarget | undefined {
  for (const [townMapId, locations] of Object.entries(townMapLocations)) {
    const location = locations.find((candidate) => candidate.npcId === npcId);
    if (location) return { ...location, townMapId: townMapId as TownMapId };
  }

  return undefined;
}
