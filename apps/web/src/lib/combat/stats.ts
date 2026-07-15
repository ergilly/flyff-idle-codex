import { type Character, type CharacterEquipmentSlot, type ItemMetadata } from "@/lib/api";
import { jobConstants, weaponSpeedModifiers } from "@/lib/combat/constants";
import { type CombatState, type CombatStat, type JobCombatConstants } from "@/lib/combat/types";
import { findItemSetByPartId, type ItemSetBonus } from "@/lib/itemSets";

const equipmentSlots: CharacterEquipmentSlot[] = [
  "helmet",
  "suit",
  "gloves",
  "boots",
  "csBoots",
  "csGloves",
  "csSuit",
  "csHelm",
  "mask",
  "cloak",
  "offhand",
  "mainhand",
  "ringR",
  "earringR",
  "necklace",
  "earringL",
  "ringL"
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getItem(itemsById: Record<string, ItemMetadata>, itemId: string | null | undefined) {
  return itemId ? itemsById[itemId] : undefined;
}

function getCharacterEquipmentSet(character: Character, equipmentSet: number) {
  return (
    character.equipmentSets?.[equipmentSet] ??
    (equipmentSet === 0 ? character.equipment : character.equipment)
  );
}

function getEquippedItems(character: Character, itemsById: Record<string, ItemMetadata>, equipmentSet = 0) {
  const equipment = getCharacterEquipmentSet(character, equipmentSet);

  return equipmentSlots
    .map((slot) => getItem(itemsById, equipment[slot]))
    .filter((item): item is ItemMetadata => Boolean(item));
}

function getEquippedItemIds(character: Character, equipmentSet = 0) {
  const equipment = getCharacterEquipmentSet(character, equipmentSet);

  return equipmentSlots.map((slot) => equipment[slot]).filter((itemId): itemId is string => Boolean(itemId));
}

function getActiveSetBonuses(equippedItemIds: string[]) {
  const equippedItemIdSet = new Set(equippedItemIds);
  const itemSetsById = new Map<number, ReturnType<typeof findItemSetByPartId>>();

  equippedItemIds.forEach((itemId) => {
    const itemSet = findItemSetByPartId(itemId);

    if (itemSet) {
      itemSetsById.set(itemSet.id, itemSet);
    }
  });

  return Array.from(itemSetsById.values()).flatMap((itemSet) => {
    if (!itemSet) {
      return [];
    }

    const equippedSetItemCount = itemSet.parts.filter((part) =>
      equippedItemIdSet.has(String(part.id))
    ).length;

    return itemSet.bonus.filter((bonus) => equippedSetItemCount >= bonus.equipped);
  });
}

export function getAbilityTotal(
  items: ItemMetadata[],
  setBonuses: ReadonlyArray<ItemSetBonus>,
  parameter: string,
  rate = false
) {
  const itemAbilityTotal = items.reduce((total, item) => {
    const matchingAbilities = getMatchingAbilities(item.abilities, parameter, rate);

    return total + matchingAbilities.reduce((abilityTotal, ability) => abilityTotal + (ability.add ?? 0), 0);
  }, 0);
  const matchingSetBonus = setBonuses.find(
    (bonus) => getMatchingAbilities([bonus.ability], parameter, rate).length > 0
  );
  const setAbilityTotal = matchingSetBonus?.ability.add ?? 0;

  return itemAbilityTotal + setAbilityTotal;
}

function normalizeAbilityParameter(parameter: string) {
  return parameter.toLowerCase().replace(/[\s_]+/g, "");
}

function getMatchingAbilities(abilities: ItemMetadata["abilities"], parameter: string, rate: boolean) {
  const normalizedParameter = normalizeAbilityParameter(parameter);

  return (abilities ?? []).filter((ability) => {
    const normalizedAbilityParameter = normalizeAbilityParameter(ability.parameter);

    return (
      ability.rate === rate &&
      (normalizedAbilityParameter === normalizedParameter ||
        (["str", "sta", "dex", "int"].includes(normalizedParameter) &&
          normalizedAbilityParameter === "allstats"))
    );
  });
}

function getAbilityTotals(
  items: ItemMetadata[],
  setBonuses: ReadonlyArray<ItemSetBonus>,
  parameters: string[],
  rate = false
) {
  return parameters.reduce(
    (total, parameter) => total + getAbilityTotal(items, setBonuses, parameter, rate),
    0
  );
}

function getBaseClassSpeed(job: JobCombatConstants) {
  if (job.attackSpeed < 72) {
    return 65;
  }

  return job.attackSpeed > 72 ? 77 : 72;
}

function getWeaponSpeedModifier(weapon: ItemMetadata | undefined) {
  const speedName = weapon?.attackSpeed?.toLowerCase().replace(/\s+/g, "") ?? "normal";

  return weaponSpeedModifiers[speedName] ?? weaponSpeedModifiers.normal;
}

export function getMaxWeaponHitsPerSecond(weapon: ItemMetadata | undefined) {
  const weaponType = weapon?.subcategory?.toLowerCase() ?? "sword";

  if (weapon?.twoHanded && ["axe", "sword", "staff", "stick"].includes(weaponType)) {
    return 1.67;
  }

  switch (weaponType) {
    case "bow":
    case "wand":
      return 1.85;
    case "yoyo":
      return 2.22;
    case "axe":
      return 2.35;
    case "knuckle":
      return 2.85;
    case "sword":
    default:
      return 2.62;
  }
}

function getAttackSpeedBuff(equippedItems: ItemMetadata[], setBonuses: ReadonlyArray<ItemSetBonus>) {
  return (
    getAbilityTotals(equippedItems, setBonuses, ["attackspeed", "actionspeed"]) +
    getAbilityTotals(equippedItems, setBonuses, ["attackspeed", "actionspeed"], true)
  );
}

function getSheetAttackSpeedPercent(
  job: JobCombatConstants,
  weapon: ItemMetadata | undefined,
  dex: number,
  equippedItems: ItemMetadata[],
  setBonuses: ReadonlyArray<ItemSetBonus>
) {
  return Math.min(
    100,
    getBaseClassSpeed(job) * 0.75 +
      Math.floor(dex * getWeaponSpeedModifier(weapon)) * 4 +
      getAttackSpeedBuff(equippedItems, setBonuses)
  );
}

export function getEquipmentDefense(items: ItemMetadata[]) {
  const defenseItems = items.filter((item) => item.minDefense !== null && item.maxDefense !== null);

  return defenseItems.reduce(
    (total, item) => total + ((item.minDefense ?? 0) + (item.maxDefense ?? 0)) / 2,
    0
  );
}

export function getWeaponHitRange(
  weapon: ItemMetadata | undefined,
  stats: Character["stats"],
  level: number,
  job: JobCombatConstants,
  items: ItemMetadata[],
  setBonuses: ReadonlyArray<ItemSetBonus>
) {
  const weaponType = weapon?.subcategory ?? "sword";
  const plus =
    getWeaponStatAttack(weaponType, stats, level, job, items, setBonuses) +
    getAbilityTotal(items, setBonuses, "damage");

  return {
    min: (weapon?.minAttack ?? 1) * 2 + plus,
    max: (weapon?.maxAttack ?? 1) * 2 + plus
  };
}

function getWeaponStatAttack(
  weaponType: string,
  stats: Character["stats"],
  level: number,
  job: JobCombatConstants,
  items: ItemMetadata[],
  setBonuses: ReadonlyArray<ItemSetBonus>
) {
  let levelFactor = 1.1;
  let statValue = stats.str - 10;
  let addValue = 0;

  switch (weaponType) {
    case "sword":
    case "yoyo":
      statValue = stats.str - 12;
      break;
    case "axe":
      levelFactor = 1.2;
      statValue = stats.str - 12;
      break;
    case "staff":
      statValue = stats.str - 10;
      break;
    case "stick":
      levelFactor = 1.3;
      statValue = stats.str - 10;
      break;
    case "knuckle":
      levelFactor = 1.2;
      statValue = stats.str - 10;
      break;
    case "wand":
      levelFactor = 1.2;
      statValue = stats.int - 10;
      break;
    case "bow":
      levelFactor = 0.91;
      statValue = stats.dex - 14;
      addValue = 0.14 * stats.str;
      break;
  }

  return (
    getAbilityTotal(items, setBonuses, `${weaponType}attack`) +
    Math.floor(statValue * (job.weaponFactors[weaponType] ?? 1) + level * levelFactor + addValue)
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function formatPercent(value: number, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`;
}

export function parsePercent(value: string | undefined) {
  const parsedValue = Number(value?.replace(/,/g, "").replace("%", ""));

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function parseNumber(value: string | undefined) {
  const parsedValue = Number(value?.replace(/,/g, ""));

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function getCombatStatValue(combatStats: CombatStat[], label: string) {
  return combatStats.find((entry) => entry.label === label)?.value;
}

function formatDirectBonus(
  items: ItemMetadata[],
  setBonuses: ReadonlyArray<ItemSetBonus>,
  parameter: string
) {
  const flatTotal = getAbilityTotal(items, setBonuses, parameter);
  const rateTotal = getAbilityTotal(items, setBonuses, parameter, true);
  const values = [];

  if (flatTotal !== 0) {
    values.push(formatNumber(flatTotal));
  }

  if (rateTotal !== 0) {
    values.push(formatPercent(rateTotal));
  }

  return values.length > 0 ? values.join(" + ") : "0";
}

export function getCombatStats(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet = 0
): CombatStat[] {
  const state = getCombatState(character, itemsById, equipmentSet);
  const job = jobConstants[character.job] ?? jobConstants.Vagrant;
  const {
    attackPower,
    attackSpeedPercent,
    criticalChance,
    criticalDamage,
    equippedItems,
    level,
    setBonuses,
    stats
  } = state;
  const baseDefense =
    Math.floor((level * 2 + stats.sta / 2) / 2.8 - 4 + (stats.sta - 14) * job.def) +
    getEquipmentDefense(equippedItems);
  const defense =
    baseDefense * (1 + getAbilityTotal(equippedItems, setBonuses, "def", true) / 100) +
    getAbilityTotal(equippedItems, setBonuses, "def");
  const baseMagicDefense =
    Math.floor((level * 2 + stats.sta / 2) / 2.8 - 4 + (stats.sta - 14) * job.mDefSta) +
    Math.floor((stats.int - 14) * job.mDefInt);
  const magicDefense =
    baseMagicDefense * (1 + getAbilityTotal(equippedItems, setBonuses, "magicdefense", true) / 100) +
    getAbilityTotal(equippedItems, setBonuses, "magicdefense");
  const parry = stats.dex / 2 + getAbilityTotal(equippedItems, setBonuses, "parry");
  const blockB = clamp(Math.floor((stats.dex + 17) * ((stats.dex - 15) / 800)), 0, 10);
  const baseBlock = Math.max(blockB + Math.floor((stats.dex / 8) * job.block), 0);
  const block = clamp(baseBlock + getAbilityTotal(equippedItems, setBonuses, "block", true), 0, 100);
  const meleeBlock = clamp(block + getAbilityTotal(equippedItems, setBonuses, "meleeblock", true), 0, 100);
  const rangedBlock = clamp(block + getAbilityTotal(equippedItems, setBonuses, "rangedblock", true), 0, 100);
  const maxHp = Math.floor(
    (150 + level * job.hpLevel + stats.sta * level * job.hp) *
      (1 + getAbilityTotal(equippedItems, setBonuses, "maxhp", true) / 100) +
      getAbilityTotal(equippedItems, setBonuses, "maxhp")
  );
  const maxFp = Math.floor(
    (level * job.fpLevel + stats.sta * job.fp) *
      (1 + getAbilityTotal(equippedItems, setBonuses, "maxfp", true) / 100) +
      getAbilityTotal(equippedItems, setBonuses, "maxfp")
  );
  const maxMp = Math.floor(
    (22 + level * job.mpLevel + stats.int * job.mp) *
      (1 + getAbilityTotal(equippedItems, setBonuses, "maxmp", true) / 100) +
      getAbilityTotal(equippedItems, setBonuses, "maxmp")
  );
  const decreasedCastingTime = clamp(
    1 + getAbilityTotal(equippedItems, setBonuses, "decreasedcastingtime", true) / 100,
    0.1,
    2
  );
  const hitRate = Math.max(stats.dex / 4 + getAbilityTotal(equippedItems, setBonuses, "hitrate", true), 20);

  return [
    { label: "STR", value: formatNumber(stats.str) },
    { label: "STA", value: formatNumber(stats.sta) },
    { label: "DEX", value: formatNumber(stats.dex) },
    { label: "INT", value: formatNumber(stats.int) },
    { label: "Max HP", value: formatNumber(maxHp) },
    { label: "Max MP", value: formatNumber(maxMp) },
    { label: "Max FP", value: formatNumber(maxFp) },
    { label: "Attack", value: formatNumber(attackPower) },
    {
      label: "Magic Attack",
      value: formatDirectBonus(equippedItems, setBonuses, "magicattack")
    },
    {
      label: "PvE Damage",
      value: formatPercent(getAbilityTotal(equippedItems, setBonuses, "pvedamage", true))
    },
    { label: "Critical Chance", value: formatPercent(criticalChance) },
    {
      label: "Critical Damage",
      value: formatPercent(criticalDamage)
    },
    { label: "Attack Speed", value: formatPercent(attackSpeedPercent) },
    {
      label: "DCT",
      value: formatPercent(decreasedCastingTime * 100)
    },
    {
      label: "Hit Rate",
      value: formatPercent(hitRate, 1)
    },
    { label: "Defense", value: formatNumber(defense) },
    { label: "Magic DEF", value: formatNumber(Math.max(0, magicDefense)) },
    {
      label: "Critical Resist",
      value: formatPercent(getAbilityTotal(equippedItems, setBonuses, "criticalresist", true))
    },
    { label: "Melee Block", value: formatPercent(meleeBlock) },
    { label: "Ranged Block", value: formatPercent(rangedBlock) },
    { label: "Parry", value: formatNumber(parry) },
    {
      label: "Reflect Damage",
      value: formatPercent(getAbilityTotal(equippedItems, setBonuses, "reflectdamage", true))
    },
    {
      label: "HP Recovery After Kill",
      value: formatDirectBonus(equippedItems, setBonuses, "hprecoveryafterkill")
    },
    {
      label: "MP Recovery After Kill",
      value: formatDirectBonus(equippedItems, setBonuses, "mprecoveryafterkill")
    }
  ];
}

export function getCombatState(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet = 0
): CombatState {
  const job = jobConstants[character.job] ?? jobConstants.Vagrant;
  const equippedItems = getEquippedItems(character, itemsById, equipmentSet);
  const equippedItemIds = getEquippedItemIds(character, equipmentSet);
  const setBonuses = getActiveSetBonuses(equippedItemIds);
  const equipment = getCharacterEquipmentSet(character, equipmentSet);
  const mainhand = getItem(itemsById, equipment.mainhand);
  const offhand = getItem(itemsById, equipment.offhand);
  const stats = {
    str: character.stats.str + getAbilityTotal(equippedItems, setBonuses, "str"),
    sta: character.stats.sta + getAbilityTotal(equippedItems, setBonuses, "sta"),
    dex: character.stats.dex + getAbilityTotal(equippedItems, setBonuses, "dex"),
    int: character.stats.int + getAbilityTotal(equippedItems, setBonuses, "int")
  };
  const level = character.level;
  const hitRange = getWeaponHitRange(mainhand, stats, level, job, equippedItems, setBonuses);
  const attackPower = Math.max(
    0,
    Math.floor((hitRange.min + hitRange.max) / 2) *
      (1 + getAbilityTotal(equippedItems, setBonuses, "attack", true) / 100) +
      getAbilityTotal(equippedItems, setBonuses, "attack")
  );
  const criticalChance = Math.max(
    0,
    Math.floor((stats.dex / 10) * job.critical) +
      getAbilityTotal(equippedItems, setBonuses, "criticalchance", true)
  );
  const attackSpeedPercent = getSheetAttackSpeedPercent(job, mainhand, stats.dex, equippedItems, setBonuses);
  const attackSpeed = getMaxWeaponHitsPerSecond(mainhand) * (attackSpeedPercent / 100);

  return {
    attackPower,
    attackSpeed,
    attackSpeedPercent,
    criticalChance,
    criticalDamage: getAbilityTotal(equippedItems, setBonuses, "criticaldamage", true),
    equippedItems,
    level,
    mainhand,
    offhand,
    setBonuses,
    stats
  };
}
