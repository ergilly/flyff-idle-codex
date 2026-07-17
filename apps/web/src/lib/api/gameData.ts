import { apiBaseUrl } from "@/lib/api/config";
import {
  type DataSetQueryResponse,
  type ItemMetadata,
  type MapMonsterFamily,
  type MapMonsterMetadata,
  type MonsterFamily,
  type MonsterFamilyNames,
  type MonsterFamilyRequest,
  type MonsterFamilyVariant,
  type MonsterMetadata,
  type MonsterQuestDrop,
  type MonsterVariantRank
} from "@/lib/api/types";

export function getItemIconUrl(icon: string) {
  return `${apiBaseUrl}/api/images/item/${encodeURIComponent(icon)}`;
}

export function getMonsterIconUrl(icon: string) {
  return `${apiBaseUrl}/api/images/monster/${encodeURIComponent(icon)}`;
}

export function getSkillIconUrl(icon: string) {
  return `${apiBaseUrl}/api/images/skill/${encodeURIComponent(icon)}`;
}

export async function fetchItems(token: string, itemIds: string[]): Promise<ItemMetadata[]> {
  const uniqueItemIds = Array.from(
    new Set(itemIds.map((itemId) => String(itemId).trim()).filter((itemId) => /^\d+$/.test(itemId)))
  );

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
          "id,name,experience,level,rank,area,element,hp,minAttack,maxAttack,defense,magicDefense,sta,str,dex,int,hitRate,parry,noLevelReduction,minDropGold,maxDropGold",
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
  return hydrateMapMonsterFamilies(getMapMonsterFamilies(mapMonsters));
}

let mapMonsterFamilyIndexPromise: Promise<Record<string, MapMonsterFamily[]>> | null = null;

export function fetchMapMonsterFamilyIndex() {
  mapMonsterFamilyIndexPromise ??= loadMapMonsterFamilyIndex().catch((error: unknown) => {
    mapMonsterFamilyIndexPromise = null;
    throw error;
  });

  return mapMonsterFamilyIndexPromise;
}

async function loadMapMonsterFamilyIndex() {
  const mapMonsters = await fetchDataSet<MapMonsterMetadata>("mapMonsters", {
    fields: `${monsterFamilyFields},family,location`,
    limit: 500
  });
  const families = await hydrateMapMonsterFamilies(getMapMonsterFamilies(mapMonsters));

  return families.reduce<Record<string, MapMonsterFamily[]>>((familiesByRegion, family) => {
    familiesByRegion[family.location.region] = [...(familiesByRegion[family.location.region] ?? []), family];
    return familiesByRegion;
  }, {});
}

async function hydrateMapMonsterFamilies(monsterFamilies: MapMonsterFamily[]) {
  const questDropIds = getQuestDropItemIds(monsterFamilies.flatMap((family) => family.variants));
  const questDropsByItemId = await fetchQuestDropsByItemId(questDropIds);

  return monsterFamilies.map((family) => ({
    ...family,
    questDrops: getFamilyQuestDrops(family, questDropsByItemId)
  }));
}

const monsterFamilyFields =
  "id,name,event,experience,icon,level,rank,area,element,drops,hp,minAttack,maxAttack,defense,magicDefense,sta,str,dex,int,hitRate,parry,noLevelReduction,minDropGold,maxDropGold";

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
    experience: monster.experience,
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
    noLevelReduction: monster.noLevelReduction,
    parry: monster.parry,
    rank: monster.rank,
    sta: monster.sta,
    str: monster.str,
    dex: monster.dex,
    int: monster.int,
    hitRate: monster.hitRate,
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
