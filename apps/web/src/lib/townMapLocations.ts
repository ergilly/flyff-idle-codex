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

export const townMapLocations: Record<TownMapId, TownMapLocation[]> = {
  "flarine-town": [
    shop("red-chip-merchant", "Red Chip Merchant", 32.9, 20.9),
    npc("center-for-guild-combat", "Center for Guild Combat", 35.2, 29.3),
    npc("guild-house-manager", "Guild House Manager", 23, 44.5),
    shop("general-store", "General Store", 30.2, 45.3),
    npc("arena-manager", "Arena Manager", 19.9, 52),
    npc("pet-tamer", "Pet Tamer", 35, 51.8),
    shop("station", "Station", 26.3, 57.1),
    shop("armory", "Armory", 18.6, 60.3),
    npc("housing-specialist", "Housing Specialist", 35.5, 59.8),
    npc("buff-pang", "Buff Pang", 29.5, 65.1),
    npc("public-office", "Public Office", 26.7, 68.5),
    npc("quest-office", "Mikyel", 65.8, 52.4, 29),
    shop("magic-vendor", "Magic Vendor", 77.9, 45.7),
    shop("food-vendor", "Food Vendor", 77.7, 66.1)
  ],
  "sain-city": [
    shop("station", "Station", 44.9, 25.1),
    shop("magic-vendor", "Magic Vendor", 35.5, 63.5),
    shop("armory", "Armory", 40.9, 73.3),
    shop("general-store", "General Store", 47, 72.6),
    shop("food-vendor", "Food Vendor", 40, 79.1),
    npc("quest-office", "Lancomi", 54.8, 75.4, 4000),
    npc("arena-manager", "Arena Manager", 48, 81.8),
    npc("pet-tamer", "Pet Tamer", 52.4, 81.7),
    npc("buff-pang", "Buff Pang", 50.2, 84.7),
    npc("public-office", "Public Office", 52.5, 87.8)
  ],
  "darken-city": [
    npc("pet-tamer", "Pet Tamer", 41.7, 42.2),
    npc("public-office", "Public Office", 43.5, 45.8),
    shop("general-store", "General Store", 54.4, 46.9),
    npc("arena-manager", "Arena Manager", 36.1, 50),
    npc("buff-pang", "Buff Pang", 34.3, 50.4),
    shop("station", "Station", 47.7, 51.4),
    npc("quest-office", "Lurif", 42.3, 57.3, 4677),
    shop("armory", "Armory", 22.8, 59.7),
    shop("magic-vendor", "Magic Vendor", 60.4, 71.9),
    shop("food-vendor", "Food Vendor", 43.8, 78.1)
  ],
  eillun: [
    npc("housing-specialist", "Housing Specialist", 46.6, 22.4),
    shop("magic-vendor", "Magic Vendor", 46.4, 35.9),
    shop("food-vendor", "Food Vendor", 42.7, 39.2),
    shop("general-store", "General Store", 51.6, 34.7),
    npc("guild-house-manager", "Guild House Manager", 62.9, 28.3),
    shop("red-chip-merchant", "Red Chip Merchant", 70.8, 40.4),
    npc("pet-tamer", "Pet Tamer", 40, 43.2),
    npc("public-office", "Public Office", 38.4, 53.3),
    npc("quest-office", "Miorang", 41.6, 58.6, 20250),
    shop("armory", "Armory", 53.5, 60.2),
    npc("arena-manager", "Arena Manager", 64.9, 65.3)
  ]
};

function npc(id: string, label: string, x: number, y: number, npcId?: number): TownMapLocation {
  return { id, iconSrc: getTownLocationIconSrc(id), kind: "npc", label, npcId, x, y };
}

function shop(id: string, label: string, x: number, y: number): TownMapLocation {
  return { id, iconSrc: getTownLocationIconSrc(id), kind: "shop", label, x, y };
}

function getTownLocationIconSrc(id: string) {
  return `/images/maps/town-icons/${id}.png`;
}
