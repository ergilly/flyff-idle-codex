import { type MapMonsterFamily } from "@/lib/api";
import { type TownMapId } from "@/lib/townMapLocations";
import authoredMapMarkers from "../../../../content/authored/maps/location-markers.json";

export const mapRegionIds = [
  "bahara",
  "darkon12",
  "darkon3",
  "flaris",
  "kaillun",
  "rhisis",
  "saint",
  "shaduwar",
  "valley"
] as const;

export type MapRegionId = (typeof mapRegionIds)[number];

export type MapMonsterMarker = {
  description: string;
  family: string;
  id: string;
  iconSrc: string;
  label: string;
  markerType: "dungeon" | "monster" | "town";
  scale: number;
  townMapId?: TownMapId;
  townMapSrc?: string;
  x: number;
  y: number;
};

export const mapLocationMarkers = authoredMapMarkers.regions as Record<MapRegionId, MapMonsterMarker[]>;
export function getMonsterMarkerIconSrc(family: string) {
  return `/images/monster-icons/${slugifyMonsterFamily(family)}.png`;
}

export function createMapMonsterMarkers(monsterFamilies: MapMonsterFamily[]) {
  return monsterFamilies.map((family) => ({
    description: `Spawn marker for ${family.name}.`,
    family: family.family,
    iconSrc: getMonsterMarkerIconSrc(family.family),
    id: getMapMonsterMarkerId(family),
    label: family.name,
    markerType: "monster" as const,
    scale: 1,
    x: family.location.x,
    y: family.location.y
  }));
}

export function getMonsterFamiliesByMarkerId(monsterFamilies: MapMonsterFamily[]) {
  return Object.fromEntries(monsterFamilies.map((family) => [getMapMonsterMarkerId(family), family]));
}

function getMapMonsterMarkerId(family: MapMonsterFamily) {
  return [family.location.region, family.family, family.location.x, family.location.y].join("-");
}

function slugifyMonsterFamily(family: string) {
  return family
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
