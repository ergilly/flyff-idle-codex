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
  id: string;
  iconSrc: string;
  label: string;
  monsterName: string | null;
  x: number;
  y: number;
};

type MonsterAssignment = {
  monsterName?: string;
  note?: string;
};

const monsterSpriteSlugs: Partial<Record<MapRegionId, string>> = {
  bahara: "bahara",
  darkon12: "darkon12",
  darkon3: "darkon3",
  flaris: "flaris",
  shaduwar: "harmonin",
  valley: "estia",
  kaillun: "kaillun",
  rhisis: "ricis",
  saint: "saint"
};

const monsterPositions: Partial<Record<MapRegionId, Array<[number, number]>>> = {
  flaris: [
    [35, 70],
    [46, 65],
    [44, 59],
    [42, 52],
    [30, 57],
    [50, 56],
    [36, 50],
    [45, 45],
    [47, 39],
    [52, 35],
    [58, 39],
    [70, 55],
    [18, 52]
  ],
  saint: [
    [42, 38],
    [42, 45],
    [30, 40],
    [48, 45],
    [37, 47],
    [37, 57],
    [30, 55],
    [35, 66],
    [29, 64],
    [53, 78],
    [40, 87],
    [30, 80],
    [56, 70],
    [49, 58],
    [50, 68],
    [62, 27]
  ],
  rhisis: [
    [48, 58],
    [40, 38],
    [30, 65],
    [59, 34],
    [60, 60],
    [70, 46]
  ],
  darkon12: [
    [77, 47],
    [77, 53],
    [86, 57],
    [73, 50],
    [28, 31],
    [60, 64],
    [70, 65],
    [24, 27],
    [20, 30],
    [65, 42],
    [60, 42],
    [55, 44],
    [55, 54],
    [60, 52],
    [50, 45],
    [44, 40],
    [38, 37]
  ],
  darkon3: [
    [70, 58],
    [63, 59],
    [63, 44],
    [55, 53],
    [35, 18],
    [42, 25],
    [48, 25],
    [38, 40],
    [50, 40],
    [45, 54],
    [49, 67],
    [54, 67],
    [42, 70],
    [50, 78],
    [62, 65],
    [67, 65],
    [61, 71],
    [66, 72]
  ],
  shaduwar: [
    [32, 50],
    [60, 35],
    [60, 50],
    [40, 58],
    [46, 46]
  ],
  valley: [
    [52, 56],
    [64, 50],
    [50, 43],
    [42, 23],
    [36, 37],
    [41, 58],
    [63, 67]
    // [27, 51],
    // [39, 52]
  ],
  kaillun: [
    [23, 65],
    [18, 43],
    [32, 45],
    [52, 24],
    [58, 60],
    [73, 43],
    [73, 60]
  ],
  bahara: [
    [18, 58],
    [50, 45],
    [30, 75],
    [60, 45],
    [30, 48],
    [58, 20],
    [35, 75],
    [53, 72],
    [35, 48]
  ]
};

const monsterAssignments: Partial<Record<MapRegionId, MonsterAssignment[]>> = {
  flaris: [
    { monsterName: "Aibatt" },
    { monsterName: "Mushpang" },
    { monsterName: "Burudeng" },
    { monsterName: "Pukepuke" },
    { monsterName: "Peakyturtle" },
    { monsterName: "Demian" },
    { monsterName: "Doridoma" },
    { monsterName: "Lawolf" },
    { monsterName: "Fefern" },
    { monsterName: "Nyangnyang" },
    { monsterName: "Bang" },
    { monsterName: "Mothbee" },
    { monsterName: "Rockepeller" }
  ],
  saint: [
    { monsterName: "Bang" },
    { monsterName: "Flybat" },
    { monsterName: "Mothbee" },
    { monsterName: "Wagsac" },
    { monsterName: "Mia" },
    { monsterName: "Mr. Pumpkin" },
    { monsterName: "Red Mantis A" },
    { monsterName: "Jack the Hammer" },
    { monsterName: "Giggle Box" },
    { monsterName: "Bucrow" },
    { monsterName: "Rock Muscle" },
    { monsterName: "Hobo" },
    { monsterName: "Dumb bull" },
    { monsterName: "Totemia" },
    { monsterName: "Cardpuppet" },
    { monsterName: "Flybrigen" }
  ],
  rhisis: [
    { monsterName: "Scorpicon" },
    { monsterName: "Tombstone Bearer" },
    { monsterName: "Flybrigen" },
    { monsterName: "Basque" },
    { monsterName: "Prankster" },
    { monsterName: "Wheelem" }
  ],
  darkon12: [
    { monsterName: "Leyena" },
    { monsterName: "Trangfoma" },
    { monsterName: "Rockepeller" },
    { monsterName: "Steam Walker" },
    { monsterName: "Zombiger" },
    { monsterName: "Steel Knight" },
    { monsterName: "Nutty Wheel" },
    { monsterName: "Nuctuvehicle" },
    { monsterName: "Risem" },
    { monsterName: "Driller" },
    { monsterName: "Volt" },
    { monsterName: "Elderguard" },
    { monsterName: "Garbagespider" },
    { monsterName: "Crane Machinery" },
    { monsterName: "Syliaca" },
    { monsterName: "Greemong" },
    { monsterName: "Carrierbomb" }
  ],
  darkon3: [
    { monsterName: "Grrr" },
    { monsterName: "Dump" },
    { monsterName: "Nautrepy" },
    { monsterName: "Boo" },
    { monsterName: "Hoppre" },
    { monsterName: "Mushpoie" },
    { monsterName: "Iren" },
    { monsterName: "Watangka" },
    { monsterName: "Antiquery" },
    { monsterName: "Luia" },
    { monsterName: "Gongury" },
    { monsterName: "Shuhamma" },
    { monsterName: "Kern" },
    { monsterName: "Glaphan" },
    { monsterName: "Chimeradon" },
    { monsterName: "Private Bearnerky" },
    { monsterName: "1st Chef Muffrin" },
    { monsterName: "Queen Popcrank" }
  ],
  shaduwar: createEmptyAssignments(5),
  valley: createEmptyAssignments(7),
  kaillun: createEmptyAssignments(7),
  bahara: createEmptyAssignments(9)
};

export const monsterMarkersByRegion: Record<MapRegionId, MapMonsterMarker[]> = {
  bahara: createRegionMarkers("bahara", "Bahara"),
  darkon12: createRegionMarkers("darkon12", "Darkon 1 and 2"),
  darkon3: createRegionMarkers("darkon3", "Darkon 3"),
  flaris: createRegionMarkers("flaris", "Flaris"),
  kaillun: createRegionMarkers("kaillun", "Kaillun"),
  rhisis: createRegionMarkers("rhisis", "Garden of Rhisis"),
  saint: createRegionMarkers("saint", "Saint Morning"),
  shaduwar: createRegionMarkers("shaduwar", "Shaduwar"),
  valley: createRegionMarkers("valley", "Valley of the Risen")
};

function createRegionMarkers(regionId: MapRegionId, regionLabel: string): MapMonsterMarker[] {
  const spriteSlug = monsterSpriteSlugs[regionId];
  const positions = monsterPositions[regionId] ?? [];
  const assignments = monsterAssignments[regionId] ?? [];

  if (!spriteSlug) {
    return [];
  }

  return positions.map(([x, y], index) => {
    const spriteNumber = index + 1;
    const assignment = assignments[index];
    const fallbackLabel = `${regionLabel} monster ${spriteNumber}`;

    return {
      description:
        assignment?.note ??
        (assignment?.monsterName
          ? `Spawn marker assigned to ${assignment.monsterName}.`
          : `Assign this marker by adding monsterName to ${regionId} slot ${spriteNumber}.`),
      id: `${regionId}-${spriteNumber}`,
      iconSrc: `/images/monsters/png/sprites/${spriteSlug}-${String(spriteNumber).padStart(2, "0")}.png`,
      label: assignment?.monsterName ?? fallbackLabel,
      monsterName: assignment?.monsterName ?? null,
      x,
      y
    };
  });
}

function createEmptyAssignments(count: number): MonsterAssignment[] {
  return Array.from({ length: count }, () => ({}));
}
