export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    isAdmin: boolean;
  };
};

export type Character = {
  id: string;
  slotIndex: number;
  name: string;
  gender: CharacterGender;
  job: string;
  progressionRank: CharacterProgressionRank;
  level: number;
  exp: number;
  penya: number;
  stats: CharacterStats;
  skillLevels: CharacterSkillLevels;
  equipment: CharacterEquipment;
  equipmentSets?: CharacterEquipment[];
  inventory: CharacterInventory;
};

export type CharacterGender = "male" | "female";
export type CharacterProgressionRank = "normal" | "master" | "hero";

export type CharacterStats = {
  str: number;
  sta: number;
  dex: number;
  int: number;
};

export type CharacterSkillLevels = Record<string, number>;

export type CharacterEquipment = {
  helmet: string | null;
  suit: string | null;
  gloves: string | null;
  boots: string | null;
  flying: string | null;
  csBoots: string | null;
  csGloves: string | null;
  csSuit: string | null;
  csHelm: string | null;
  mask: string | null;
  cloak: string | null;
  ammo: string | null;
  offhand: string | null;
  mainhand: string | null;
  ringR: string | null;
  earringR: string | null;
  necklace: string | null;
  earringL: string | null;
  ringL: string | null;
};

export type CharacterEquipmentSlot = keyof CharacterEquipment;

export type CharacterInventory = {
  size: number;
  items: CharacterInventoryItem[];
};

export type CharacterInventoryItem = {
  slotIndex: number;
  itemId: string;
  quantity: number;
};

export type InventorySortOption = "name" | "level" | "job" | "category";

export type ItemMetadata = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  subcategory: string | null;
  rarity: string | null;
  level: number | null;
  sex: string | null;
  requiredJob: string | null;
  minAttack: number | null;
  maxAttack: number | null;
  attackSpeed: string | null;
  twoHanded: boolean | null;
  minDefense: number | null;
  maxDefense: number | null;
  stack?: number | null;
  abilities: Array<{
    parameter: string;
    add: number | null;
    rate: boolean;
  }>;
};

export type MonsterMetadata = {
  id: number | string;
  name: string;
  drops?: MonsterDrop[];
  event?: boolean;
  icon?: string | null;
  level: number | null;
  rank: string | null;
  area: string | null;
  element: string | null;
  hp: number | null;
  minAttack: number | null;
  maxAttack: number | null;
  defense: number | null;
  magicDefense: number | null;
  minDropGold: number | null;
  maxDropGold: number | null;
};

export type MonsterDrop = {
  item: number | string;
  probabilityRange?: string;
  prob?: string;
  common?: boolean;
};

export type MonsterQuestDrop = {
  id: number | string;
  name: string;
  icon: string | null;
};

export type MonsterVariantRank = "small" | "normal" | "captain" | "giant";
export type MonsterFamilyNames = Partial<Record<MonsterVariantRank, string>>;

export type MonsterFamilyVariant = Pick<
  MonsterMetadata,
  | "id"
  | "name"
  | "level"
  | "rank"
  | "element"
  | "icon"
  | "hp"
  | "minAttack"
  | "maxAttack"
  | "defense"
  | "magicDefense"
  | "minDropGold"
  | "maxDropGold"
> & {
  drops?: MonsterDrop[];
  variantRank: MonsterVariantRank;
};

export type MonsterFamily = {
  name: string;
  questDrops: MonsterQuestDrop[];
  variants: MonsterFamilyVariant[];
};

export type MonsterFamilyRequest = {
  familyNames?: MonsterFamilyNames;
  monsterName: string;
};

export type MapMonsterLocation = {
  region: string;
  x: number;
  y: number;
};

export type MapMonsterMetadata = MonsterMetadata & {
  family: string;
  location: MapMonsterLocation;
};

export type MapMonsterFamily = MonsterFamily & {
  family: string;
  location: MapMonsterLocation;
};

export type DataSetQueryResponse<T> = {
  dataSet: string;
  total: number;
  limit: number;
  offset: number;
  results: T[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const flyffItemImageBaseUrl = "https://api.flyff.com/image/item";
const flyffMonsterImageBaseUrl = "https://api.flyff.com/image/monster";

export function getItemIconUrl(icon: string) {
  return `${flyffItemImageBaseUrl}/${encodeURIComponent(icon)}`;
}

export function getMonsterIconUrl(icon: string) {
  return `${flyffMonsterImageBaseUrl}/${encodeURIComponent(icon)}`;
}

export async function fetchItems(token: string, itemIds: string[]): Promise<ItemMetadata[]> {
  const uniqueItemIds = Array.from(new Set(itemIds.filter(Boolean)));

  if (uniqueItemIds.length === 0) {
    return [];
  }

  const itemBatches = Array.from({ length: Math.ceil(uniqueItemIds.length / 50) }, (_batch, index) =>
    uniqueItemIds.slice(index * 50, index * 50 + 50)
  );

  const results = await Promise.all(
    itemBatches.map(async (batch) => {
      const response = await fetch(`${apiBaseUrl}/api/items?ids=${batch.join(",")}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Unable to load item icons");
      }

      const data = (await response.json()) as { items: ItemMetadata[] };
      return data.items;
    })
  );

  return results.flat();
}

export async function fetchDataSet<T>(
  dataSet: string,
  query: Record<string, string | number | boolean | undefined> = {}
): Promise<T[]> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  const response = await fetch(`${apiBaseUrl}/api/data/${dataSet}${queryString ? `?${queryString}` : ""}`);

  if (!response.ok) {
    throw new Error(`Unable to load ${dataSet} data`);
  }

  const data = (await response.json()) as DataSetQueryResponse<T>;
  return data.results;
}

export async function fetchMonstersByNames(monsterNames: string[]): Promise<Record<string, MonsterMetadata>> {
  const uniqueMonsterNames = Array.from(new Set(monsterNames.map((name) => name.trim()).filter(Boolean)));

  if (uniqueMonsterNames.length === 0) {
    return {};
  }

  const monsterResults = await Promise.all(
    uniqueMonsterNames.map(async (name) => {
      const monsters = await fetchDataSet<MonsterMetadata>("monsters", {
        name,
        fields:
          "id,name,level,rank,area,element,hp,minAttack,maxAttack,defense,magicDefense,minDropGold,maxDropGold",
        limit: 1
      });

      return [name, monsters[0]] as const;
    })
  );

  return Object.fromEntries(
    monsterResults.filter((entry): entry is readonly [string, MonsterMetadata] => Boolean(entry[1]))
  );
}

export async function fetchMonsterFamiliesByNames(
  monsterRequests: MonsterFamilyRequest[]
): Promise<Record<string, MonsterFamily>> {
  const uniqueMonsterRequests = getUniqueMonsterFamilyRequests(monsterRequests);

  if (uniqueMonsterRequests.length === 0) {
    return {};
  }

  const familyEntries: Array<readonly [string, MonsterFamily | undefined]> = await Promise.all(
    uniqueMonsterRequests.map(async ({ familyNames, monsterName }) => {
      if (!familyNames) {
        return [monsterName, undefined] as const;
      }

      const explicitVariants = await fetchExplicitMonsterFamilyVariants(familyNames);

      return [
        monsterName,
        {
          name: monsterName,
          questDrops: [],
          variants: explicitVariants.map(({ monster, variantRank }) =>
            toMonsterFamilyVariant(monster, variantRank)
          )
        }
      ] as const;
    })
  );

  const monsterFamilies: Record<string, MonsterFamily> = {};

  familyEntries.forEach(([name, family]) => {
    if (family) {
      monsterFamilies[name] = family;
    }
  });
  const questDropIds = getQuestDropItemIds(
    Object.values(monsterFamilies).flatMap((family) => family.variants)
  );
  const questDropsByItemId = await fetchQuestDropsByItemId(questDropIds);

  return Object.fromEntries(
    Object.entries(monsterFamilies).map(([name, family]) => [
      name,
      {
        ...family,
        questDrops: getFamilyQuestDrops(family, questDropsByItemId)
      }
    ])
  );
}

export async function fetchMapMonsterFamiliesByRegion(region: string): Promise<MapMonsterFamily[]> {
  const mapMonsters = await fetchDataSet<MapMonsterMetadata>("mapMonsters", {
    fields: `${monsterFamilyFields},family,location`,
    "location.region": region,
    limit: 500
  });
  const monsterFamilies = getMapMonsterFamilies(mapMonsters);
  const questDropIds = getQuestDropItemIds(monsterFamilies.flatMap((family) => family.variants));
  const questDropsByItemId = await fetchQuestDropsByItemId(questDropIds);

  return monsterFamilies.map((family) => ({
    ...family,
    questDrops: getFamilyQuestDrops(family, questDropsByItemId)
  }));
}

const monsterFamilyFields =
  "id,name,event,icon,level,rank,area,element,drops,hp,minAttack,maxAttack,defense,magicDefense,minDropGold,maxDropGold";

const monsterVariantOrder: MonsterVariantRank[] = ["small", "normal", "captain", "giant"];
const monsterVariantRankSet = new Set<string>(monsterVariantOrder);

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase();
}

function getMapMonsterFamilies(monsters: MapMonsterMetadata[]) {
  const familiesByLocation = new Map<string, MapMonsterMetadata[]>();

  monsters.forEach((monster) => {
    const locationKey = [
      monster.location.region,
      monster.family,
      monster.location.x,
      monster.location.y
    ].join(":");
    const familyMonsters = familiesByLocation.get(locationKey) ?? [];

    familyMonsters.push(monster);
    familiesByLocation.set(locationKey, familyMonsters);
  });

  return Array.from(familiesByLocation.entries())
    .map(([_locationKey, familyMonsters]) => {
      const sortedMonsters = [...familyMonsters].sort(
        (first, second) =>
          getMonsterVariantSortIndex(first) - getMonsterVariantSortIndex(second) ||
          (first.level ?? 0) - (second.level ?? 0)
      );
      const firstMonster = sortedMonsters[0];

      return {
        family: firstMonster.family,
        location: firstMonster.location,
        name: formatMonsterFamilyName(firstMonster.family),
        questDrops: [],
        variants: sortedMonsters.map((monster) =>
          toMonsterFamilyVariant(monster, getMonsterVariantRank(monster))
        )
      };
    })
    .sort(
      (first, second) =>
        first.location.y - second.location.y ||
        first.location.x - second.location.x ||
        (first.variants[0]?.level ?? 0) - (second.variants[0]?.level ?? 0)
    );
}

function getMonsterVariantSortIndex(monster: MonsterMetadata) {
  return monsterVariantOrder.indexOf(getMonsterVariantRank(monster));
}

function getMonsterVariantRank(monster: MonsterMetadata): MonsterVariantRank {
  const rank = monster.rank?.toLowerCase() ?? "";

  return monsterVariantRankSet.has(rank) ? (rank as MonsterVariantRank) : "normal";
}

function formatMonsterFamilyName(family: string) {
  return family
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function getUniqueMonsterFamilyRequests(monsterRequests: MonsterFamilyRequest[]) {
  const requestsByName = new Map<string, MonsterFamilyRequest>();

  monsterRequests.forEach(({ familyNames, monsterName }) => {
    const trimmedMonsterName = monsterName.trim();

    if (!trimmedMonsterName) {
      return;
    }

    requestsByName.set(trimmedMonsterName, {
      familyNames,
      monsterName: trimmedMonsterName
    });
  });

  return Array.from(requestsByName.values());
}

async function fetchMonsterByName(name: string) {
  const exactMatches = await fetchDataSet<MonsterMetadata>("monsters", {
    name,
    fields: monsterFamilyFields,
    limit: 5
  });

  return exactMatches.find((monster) => normalizeLookupValue(monster.name) === normalizeLookupValue(name));
}

async function fetchExplicitMonsterFamilyVariants(familyNames: MonsterFamilyNames) {
  const variantEntries = await Promise.all(
    monsterVariantOrder.map(async (variantRank) => {
      const monsterName = familyNames[variantRank];

      if (!monsterName) {
        return null;
      }

      const monster = await fetchMonsterByName(monsterName);

      return monster ? { monster, variantRank } : null;
    })
  );

  return variantEntries.filter(
    (entry): entry is { monster: MonsterMetadata; variantRank: MonsterVariantRank } => Boolean(entry)
  );
}

function toMonsterFamilyVariant(
  monster: MonsterMetadata,
  variantRank: MonsterVariantRank
): MonsterFamilyVariant {
  return {
    defense: monster.defense,
    drops: monster.drops,
    element: monster.element,
    hp: monster.hp,
    id: monster.id,
    icon: monster.icon,
    level: monster.level,
    magicDefense: monster.magicDefense,
    maxAttack: monster.maxAttack,
    maxDropGold: monster.maxDropGold,
    minAttack: monster.minAttack,
    minDropGold: monster.minDropGold,
    name: monster.name,
    rank: monster.rank,
    variantRank
  };
}

function getQuestDropItemIds(variants: MonsterFamilyVariant[]) {
  return Array.from(
    new Set(
      variants.flatMap((variant) => variant.drops?.map((drop) => String(drop.item)) ?? []).filter(Boolean)
    )
  );
}

async function fetchQuestDropsByItemId(itemIds: string[]) {
  if (itemIds.length === 0) {
    return {};
  }

  const items = await fetchDataSet<MonsterQuestDrop & { category: string | null }>("items", {
    fields: "id,name,icon,category",
    ids: itemIds.join(","),
    limit: 500
  });

  return Object.fromEntries(
    items
      .filter((item) => item.category === "quest")
      .map((item) => [
        String(item.id),
        {
          id: item.id,
          icon: item.icon,
          name: item.name
        }
      ])
  );
}

function getFamilyQuestDrops(family: MonsterFamily, questDropsByItemId: Record<string, MonsterQuestDrop>) {
  const questDrops = family.variants
    .flatMap((variant) => variant.drops ?? [])
    .map((drop) => questDropsByItemId[String(drop.item)])
    .filter((item): item is MonsterQuestDrop => Boolean(item));

  return Array.from(new Map(questDrops.map((item) => [String(item.id), item])).values());
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to log in");
  }

  return response.json() as Promise<AuthResponse>;
}

export async function register(displayName: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ displayName, email, password })
  });

  if (!response.ok) {
    throw new Error(response.status === 409 ? "Email already registered" : "Unable to create profile");
  }

  return response.json() as Promise<AuthResponse>;
}

export async function fetchCharacters(token: string): Promise<Character[]> {
  const response = await fetch(`${apiBaseUrl}/api/characters`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to load characters");
  }

  const data = (await response.json()) as { characters: Character[] };
  return data.characters;
}

export async function createCharacter(
  token: string,
  slotIndex: number,
  name: string,
  gender: CharacterGender
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ slotIndex, name, gender })
  });

  if (!response.ok) {
    throw new Error(
      response.status === 409 ? "That character slot is already occupied" : "Unable to create character"
    );
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function deleteCharacter(token: string, characterId: string, name: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error(
      response.status === 400 ? "Character name confirmation does not match" : "Unable to delete character"
    );
  }
}

export async function updateCharacterProgression(
  token: string,
  characterId: string,
  progression: { skillLevels?: CharacterSkillLevels; stats?: CharacterStats }
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/progression`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(progression)
  });

  if (!response.ok) {
    throw new Error("Unable to save character progression");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

async function refundCharacterPoints(
  token: string,
  characterId: string,
  refundType: "stats" | "skills"
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/admin/characters/${characterId}/refund-${refundType}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(response.status === 403 ? "Admin access is required" : "Unable to refund points");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export function refundCharacterStats(token: string, characterId: string): Promise<Character> {
  return refundCharacterPoints(token, characterId, "stats");
}

export function refundCharacterSkills(token: string, characterId: string): Promise<Character> {
  return refundCharacterPoints(token, characterId, "skills");
}

export async function addCharacterInventoryItem(
  token: string,
  characterId: string,
  input: { itemId: string; quantity: number }
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/admin/characters/${characterId}/inventory`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "Admin access is required"
        : response.status === 404
          ? "Item or character not found"
          : "Unable to add item"
    );
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function equipInventoryItem(
  token: string,
  characterId: string,
  slotIndex: number,
  equipmentSet = 0
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/${slotIndex}/equip`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ equipmentSet })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to equip item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function moveInventoryItem(
  token: string,
  characterId: string,
  fromSlotIndex: number,
  toSlotIndex: number
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/move`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fromSlotIndex, toSlotIndex })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to move item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function sortInventory(
  token: string,
  characterId: string,
  sortBy: InventorySortOption
): Promise<Character> {
  const response = await fetch(`${apiBaseUrl}/api/characters/${characterId}/inventory/sort`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sortBy })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to sort inventory");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}

export async function unequipItem(
  token: string,
  characterId: string,
  equipmentSlot: CharacterEquipmentSlot,
  equipmentSet = 0
): Promise<Character> {
  const response = await fetch(
    `${apiBaseUrl}/api/characters/${characterId}/equipment/${equipmentSlot}/unequip`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ equipmentSet })
    }
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to unequip item");
  }

  const data = (await response.json()) as { character: Character };
  return data.character;
}
