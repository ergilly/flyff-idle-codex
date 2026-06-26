export type MapRegionId =
  | "bahara"
  | "darkon12"
  | "darkon3"
  | "flaris"
  | "kaillun"
  | "rhisis"
  | "saint"
  | "shaduwar"
  | "valley";

export type MapMonsterMarker = {
  description: string;
  family: string;
  id: string;
  iconSrc: string;
  label: string;
  x: number;
  y: number;
};

export function getMonsterMarkerIconSrc(family: string) {
  return `/images/monster-icons/${slugifyMonsterFamily(family)}.png`;
}

function slugifyMonsterFamily(family: string) {
  return family
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
