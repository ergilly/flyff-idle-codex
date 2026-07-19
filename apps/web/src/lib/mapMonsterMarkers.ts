import { type MapMonsterFamily } from "@/lib/api";
import { type TownMapId } from "@/lib/townMapLocations";

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

export const mapLocationMarkers: Record<MapRegionId, MapMonsterMarker[]> = {
  flaris: [
    createTownMarker(
      "flaris",
      "flarine-town",
      "Flarine Town",
      "town-flarine",
      "flarine-town",
      "/images/maps/towns/Town_Flarine_Clean.png",
      39.5,
      70.5,
      1.5
    ),
    createDungeonMarker("flaris", "mars-mine", "Mars Mine", "dungeon-mars-mine", 57, 31, 0.8)
  ],
  saint: [
    createTownMarker(
      "saint",
      "sain-city",
      "Sain City",
      "town-sain-city",
      "sain-city",
      "/images/maps/towns/Town_Saincity_Clean.png",
      43,
      26,
      1.8
    ),
    createDungeonMarker("saint", "ivillis", "Ivillis", "dungeon-ivillis", 48, 81, 0.8)
  ],
  rhisis: [],
  darkon12: [
    createTownMarker(
      "darkon12",
      "darken-city",
      "Darken City",
      "town-darken",
      "darken-city",
      "/images/maps/towns/Town_Darken_Clean.png",
      31.5,
      36,
      1.5
    ),
    createMapIconMarker(
      "darkon12",
      "floating-castle",
      "Floating Castle",
      "Dungeon entrance for Floating Castle.",
      "floating-fortress-saturated",
      51,
      13,
      1.8
    ),
    createDungeonMarker("darkon12", "the-wilds", "The Wilds", "dungeon-the-wilds", 60, 27.7, 0.8),
    createDungeonMarker("darkon12", "savage-wilds", "Savage Wilds", "dungeon-savage-wilds", 53, 64, 0.8),
    createDungeonMarker(
      "darkon12",
      "isle-of-dreams",
      "Isle of Dreams",
      "dungeon-isle-of-dreams",
      9.8,
      14.2,
      0.8
    ),
    createDungeonMarker(
      "darkon12",
      "island-of-nightmares",
      "Island of Nightmares",
      "dungeon-island-of-nightmares",
      7,
      14.5,
      0.8
    )
  ],
  darkon3: [
    createDungeonMarker(
      "darkon3",
      "cove-of-the-ancients",
      "Cove of the Ancients",
      "dungeon-cove-of-the-ancients",
      16.5,
      67,
      0.8
    ),
    createDungeonMarker(
      "darkon3",
      "abyssal-cove-of-the-ancients",
      "Abyssal Cove of the Ancients",
      "dungeon-abyssal-cove-of-the-ancients",
      20.5,
      81,
      0.8
    ),
    createDungeonMarker("darkon3", "volkane", "Volkane", "dungeon-volkane", 50, 92.3, 0.8)
  ],
  shaduwar: [
    createTownMarker(
      "shaduwar",
      "fallen-leaf-camp",
      "Fallen Leaf Camp",
      "town-fallen-leaf-camp",
      undefined,
      undefined,
      33,
      69,
      1.2
    ),
    createDungeonMarker("shaduwar", "animus", "Animus", "dungeon-animus", 51, 25.2, 0.8),
    createDungeonMarker("shaduwar", "cursed-animus", "Cursed Animus", "dungeon-cursed-animus", 56, 43.5, 0.8)
  ],
  valley: [
    createDungeonMarker(
      "valley",
      "catacombs-of-anguish",
      "Catacombs of Anguish",
      "dungeon-catacombs-of-anguish",
      25,
      28.5,
      0.9
    )
  ],
  kaillun: [
    createTownMarker(
      "kaillun",
      "eillun",
      "Eillun",
      "town-eillun",
      "eillun",
      "/images/maps/towns/Town_Elliun_Clean.png",
      43,
      48.5,
      1.5
    ),
    createDungeonMarker("kaillun", "ankous-asylum", "Ankou's Asylum", "dungeon-ankous-asylum", 79, 37, 0.8)
  ],
  bahara: [
    createTownMarker(
      "bahara",
      "randera-camp",
      "Randera Camp",
      "town-randera-camp",
      undefined,
      undefined,
      68,
      26,
      1.2
    ),
    createDungeonMarker("bahara", "kalgas-cave", "Kalgas Cave", "dungeon-kalgas-cave", 53, 87, 0.8)
  ]
};

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

function createDungeonMarker(
  region: MapRegionId,
  id: string,
  label: string,
  iconSlug: string,
  x: number,
  y: number,
  scale: number
): MapMonsterMarker {
  return {
    description: `Dungeon entrance for ${label}.`,
    family: id,
    iconSrc: `/images/maps/icons/purple-background-regenerated/256px/${iconSlug}.webp`,
    id: `${region}-dungeon-${id}`,
    label,
    markerType: "dungeon",
    scale,
    x,
    y
  };
}

function createTownMarker(
  region: MapRegionId,
  id: string,
  label: string,
  iconSlug: string,
  townMapId: TownMapId | undefined,
  townMapSrc: string | undefined,
  x: number,
  y: number,
  scale: number
): MapMonsterMarker {
  return {
    description: `Town marker for ${label}.`,
    family: id,
    iconSrc: `/images/maps/icons/${iconSlug}-256.webp`,
    id: `${region}-town-${id}`,
    label,
    markerType: "town",
    scale,
    townMapId,
    townMapSrc,
    x,
    y
  };
}

function createMapIconMarker(
  region: MapRegionId,
  id: string,
  label: string,
  description: string,
  iconSlug: string,
  x: number,
  y: number,
  scale: number
): MapMonsterMarker {
  return {
    description,
    family: id,
    iconSrc: `/images/maps/icons/${iconSlug}-256.webp`,
    id: `${region}-dungeon-${id}`,
    label,
    markerType: "dungeon",
    scale,
    x,
    y
  };
}

function slugifyMonsterFamily(family: string) {
  return family
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
