import { type MapRegionId } from "@/lib/mapMonsterMarkers";
import { type TownMapId } from "@/lib/townMapLocations";

export type RespawnDestination = {
  regionId: MapRegionId;
  townMapId: TownMapId;
  townName: string;
};

const respawnDestinations: Record<MapRegionId, RespawnDestination> = {
  flaris: { regionId: "flaris", townMapId: "flarine-town", townName: "Flarine" },
  saint: { regionId: "saint", townMapId: "sain-city", townName: "Sain City" },
  rhisis: { regionId: "saint", townMapId: "sain-city", townName: "Sain City" },
  darkon12: { regionId: "darkon12", townMapId: "darken-city", townName: "Darken City" },
  darkon3: { regionId: "darkon12", townMapId: "darken-city", townName: "Darken City" },
  shaduwar: { regionId: "darkon12", townMapId: "darken-city", townName: "Darken City" },
  valley: { regionId: "darkon12", townMapId: "darken-city", townName: "Darken City" },
  kaillun: { regionId: "kaillun", townMapId: "eillun", townName: "Eillun" },
  bahara: { regionId: "kaillun", townMapId: "eillun", townName: "Eillun" }
};

export function getRespawnDestination(regionId: string): RespawnDestination | null {
  return Object.prototype.hasOwnProperty.call(respawnDestinations, regionId)
    ? respawnDestinations[regionId as MapRegionId]
    : null;
}

export function getRespawnHp(maxHp: number): number {
  return Math.ceil(Math.max(0, maxHp) * 0.5);
}
