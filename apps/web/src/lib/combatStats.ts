import type { Character, CharacterEquipmentSlot, ItemMetadata, MonsterFamilyVariant } from "@/lib/api";
import { findItemSetByPartId, type ItemSetBonus } from "@/lib/itemSets";

type JobCombatConstants = {
  attackSpeed: number;
  block: number;
  critical: number;
  def: number;
  fp: number;
  fpLevel: number;
  hps: number;
  hp: number;
  hpLevel: number;
  mDefInt: number;
  mDefSta: number;
  mp: number;
  mpLevel: number;
  weaponFactors: Record<string, number>;
};

export type CombatStat = {
  label: string;
  value: string;
};

export type AttackTiming = {
  attacksPerSecond: number;
  secondsPerAttack: number;
};

export type AutoAttackDamage = {
  averageDamage: number;
  damagePerSecond: number;
  effectiveHitRate: number;
  secondsToKill: number | null;
};

type CombatState = {
  attackPower: number;
  attackSpeed: number;
  criticalChance: number;
  criticalDamage: number;
  equippedItems: ItemMetadata[];
  level: number;
  mainhand: ItemMetadata | undefined;
  setBonuses: ReadonlyArray<ItemSetBonus>;
  stats: Character["stats"];
};

const defaultWeaponFactors = {
  sword: 4.5,
  axe: 5.5,
  staff: 0.8,
  stick: 3.0,
  knuckle: 5.0,
  wand: 6.0,
  yoyo: 4.2,
  bow: 3.6
};

const jobConstants: Record<string, JobCombatConstants> = {
  Vagrant: constants({
    attackSpeed: 72,
    block: 0.2,
    critical: 1,
    def: 0.9,
    hps: 4,
    hp: 0.18,
    hpLevel: 18,
    fp: 2.1,
    fpLevel: 0.6,
    mp: 2.7,
    mpLevel: 0.6,
    mDefSta: 0.3,
    mDefInt: 1.2
  }),
  Assist: constants({
    attackSpeed: 72,
    block: 0.5,
    critical: 1,
    def: 1.2,
    hps: 4,
    hp: 0.28,
    hpLevel: 28,
    fp: 4.2,
    fpLevel: 1.2,
    mp: 11.7,
    mpLevel: 2.6,
    mDefSta: 1.3,
    mDefInt: 2.3
  }),
  Billposter: constants({
    attackSpeed: 82,
    block: 0.7,
    critical: 1,
    def: 1.4,
    hps: 2.5,
    hp: 0.36,
    hpLevel: 36,
    fp: 7.7,
    fpLevel: 2.2,
    mp: 8.1,
    mpLevel: 1.8,
    mDefSta: 2,
    mDefInt: 2.8
  }),
  Ringmaster: constants({
    attackSpeed: 72,
    block: 0.6,
    critical: 1,
    def: 1.2,
    hps: 3,
    hp: 0.32,
    hpLevel: 32,
    fp: 2.8,
    fpLevel: 0.8,
    mp: 16.2,
    mpLevel: 3.6,
    mDefSta: 2,
    mDefInt: 3
  }),
  Acrobat: constants({
    attackSpeed: 77,
    block: 0.6,
    critical: 1,
    def: 1.2,
    hps: 2,
    hp: 0.28,
    hpLevel: 28,
    fp: 3.5,
    fpLevel: 1,
    mp: 4.5,
    mpLevel: 1,
    mDefSta: 0.75,
    mDefInt: 1.5
  }),
  Jester: constants({
    attackSpeed: 82,
    block: 0.8,
    critical: 4,
    def: 1.4,
    hps: 2.6,
    hp: 0.3,
    hpLevel: 30,
    fp: 7,
    fpLevel: 2,
    mp: 4.5,
    mpLevel: 1,
    mDefSta: 1.3,
    mDefInt: 2.3,
    weaponFactors: { bow: 2, yoyo: 5 }
  }),
  Ranger: constants({
    attackSpeed: 77,
    block: 0.8,
    critical: 2,
    def: 1.4,
    hps: 1.5,
    hp: 0.32,
    hpLevel: 32,
    fp: 4.2,
    fpLevel: 1.2,
    mp: 10.8,
    mpLevel: 2.4,
    mDefSta: 2,
    mDefInt: 3,
    weaponFactors: { bow: 4, yoyo: 2 }
  }),
  Magician: constants({
    attackSpeed: 62,
    block: 0.5,
    critical: 1,
    def: 1.15,
    hps: 1,
    hp: 0.28,
    hpLevel: 28,
    fp: 2.1,
    fpLevel: 0.6,
    mp: 15.3,
    mpLevel: 3.4,
    mDefSta: 3,
    mDefInt: 4.2
  }),
  Psykeeper: constants({
    attackSpeed: 67,
    block: 0.3,
    critical: 1,
    def: 1.2,
    hps: 1,
    hp: 0.3,
    hpLevel: 30,
    fp: 2.8,
    fpLevel: 0.8,
    mp: 18,
    mpLevel: 4,
    mDefSta: 3,
    mDefInt: 4.2,
    weaponFactors: { wand: 5.5 }
  }),
  Elementor: constants({
    attackSpeed: 67,
    block: 0.3,
    critical: 1,
    def: 1.2,
    hps: 1,
    hp: 0.3,
    hpLevel: 30,
    fp: 2.8,
    fpLevel: 0.8,
    mp: 18,
    mpLevel: 4,
    mDefSta: 3,
    mDefInt: 4
  }),
  Mercenary: constants({
    attackSpeed: 77,
    block: 0.5,
    critical: 1,
    def: 1.25,
    hps: 4,
    hp: 0.3,
    hpLevel: 30,
    fp: 4.9,
    fpLevel: 1.4,
    mp: 4.5,
    mpLevel: 1,
    mDefSta: 0.75,
    mDefInt: 1.5
  }),
  Blade: constants({
    attackSpeed: 87,
    block: 1.5,
    critical: 1,
    def: 1.45,
    hps: 3,
    hp: 0.3,
    hpLevel: 30,
    fp: 8.400001,
    fpLevel: 2.4,
    mp: 5.4,
    mpLevel: 1.2,
    mDefSta: 1.3,
    mDefInt: 2.3
  }),
  Knight: constants({
    attackSpeed: 77,
    block: 1,
    critical: 1,
    def: 1.55,
    hps: 2,
    hp: 0.4,
    hpLevel: 40,
    fp: 10.5,
    fpLevel: 3,
    mp: 5.4,
    mpLevel: 1.2,
    mDefSta: 1.3,
    mDefInt: 2.3
  })
};

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

function constants(
  input: Omit<JobCombatConstants, "weaponFactors"> & { weaponFactors?: Record<string, number> }
) {
  return {
    ...input,
    weaponFactors: {
      ...defaultWeaponFactors,
      ...input.weaponFactors
    }
  };
}

function clamp(value: number, min: number, max: number) {
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

function getAbilityTotal(
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

function getWeaponSpeed(weapon: ItemMetadata | undefined) {
  switch (weapon?.subcategory) {
    case "knuckle":
      return 0.07;
    case "axe":
      return weapon.twoHanded ? 0.03 : 0.06;
    case "sword":
      return weapon.twoHanded ? 0.035 : 0.085;
    case "bow":
      return 0.07;
    case "yoyo":
      return 0.075;
    case "stick":
      return 0.05;
    case "staff":
      return 0.045;
    case "wand":
      return 0.025;
    default:
      return 0.075;
  }
}

function getEquipmentDefense(items: ItemMetadata[]) {
  const defenseItems = items.filter((item) => item.minDefense !== null && item.maxDefense !== null);

  return defenseItems.reduce(
    (total, item) => total + ((item.minDefense ?? 0) + (item.maxDefense ?? 0)) / 2,
    0
  );
}

function getWeaponAttackAverage(weapon: ItemMetadata | undefined) {
  return ((weapon?.minAttack ?? 1) * 2 + (weapon?.maxAttack ?? 1) * 2) / 2;
}

function getWeaponHitRange(
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

function parsePercent(value: string | undefined) {
  const parsedValue = Number(value?.replace(/,/g, "").replace("%", ""));

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getCombatStatValue(combatStats: CombatStat[], label: string) {
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
  const { attackPower, attackSpeed, criticalChance, criticalDamage, equippedItems, level, setBonuses, stats } =
    state;
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
  const hitRate = Math.max(stats.dex / 4 + getAbilityTotal(equippedItems, setBonuses, "hitrate", true), 0);

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
    { label: "Attack Speed", value: formatPercent(Math.floor((attackSpeed * 100) / 2)) },
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

function getCombatState(
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
  const statScale = 4 * stats.dex + level / 8;
  const baseSpeed = Math.floor(Math.min(job.attackSpeed + getWeaponSpeed(mainhand) * statScale, 187.5));
  const plusValues = [
    0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.3, 1.38, 1.5
  ];
  const plusValue = plusValues[Math.floor(clamp(baseSpeed / 10, 0, plusValues.length - 1))] ?? 0;
  const attackSpeed = clamp(
    25 / (200 - baseSpeed) +
      plusValue +
      getAbilityTotals(equippedItems, setBonuses, ["attackspeed", "actionspeed"]) / 1000 +
      (getAbilityTotals(equippedItems, setBonuses, ["attackspeed", "actionspeed"], true) * 2) / 100,
    0.1,
    2
  );

  return {
    attackPower,
    attackSpeed,
    criticalChance,
    criticalDamage: getAbilityTotal(equippedItems, setBonuses, "criticaldamage", true),
    equippedItems,
    level,
    mainhand,
    setBonuses,
    stats
  };
}

export function getAutoAttackTiming(character: Character, combatStats: CombatStat[]): AttackTiming {
  const job = jobConstants[character.job] ?? jobConstants.Vagrant;
  const attackSpeedMultiplier = parsePercent(getCombatStatValue(combatStats, "Attack Speed")) / 50;
  const attacksPerSecond = Math.max(0, job.hps * attackSpeedMultiplier);

  return {
    attacksPerSecond,
    secondsPerAttack: attacksPerSecond > 0 ? 1 / attacksPerSecond : 0
  };
}

function lerp(start: number, end: number, amount: number) {
  return (1 - amount) * start + amount * end;
}

function applyAttackDefense(attack: number, defense: number) {
  const factor = 2;
  const sum = defense + factor * attack;
  const value = defense > 0 && sum > 1 ? Math.sqrt(defense / sum) : 0;
  const correction = Math.floor(lerp(defense, attack, value));

  return attack - correction;
}

function getMonsterDefense(monster: MonsterFamilyVariant) {
  const level = monster.level ?? 0;
  const sta = 1;
  const equipmentDefense = (monster.defense ?? 0) / 4;
  const defense = Math.floor(level * (2 / 2.8) + (sta * (0.5 / 2.8) + (sta - 14)) * 0.75 - 4);

  return Math.max(0, Math.floor(defense + equipmentDefense));
}

function getMonsterParry(monster: MonsterFamilyVariant) {
  return Math.max(monster.level ?? 0, 1);
}

function getBlockFactor(monster: MonsterFamilyVariant) {
  const blockRate = Math.max(Math.floor((getMonsterParry(monster) - (monster.level ?? 0)) * 0.5), 0);

  return 1 - blockRate / 100 + 0.15 * (blockRate / 100);
}

function getEffectiveHitRate(state: CombatState, monster: MonsterFamilyVariant) {
  const monsterLevel = monster.level ?? state.level;
  const factor = 1.6 * 1.5 * ((state.level * 1.2) / (state.level + monsterLevel));
  const hitRate = state.stats.dex / (state.stats.dex + getMonsterParry(monster));
  const hitProbability = Math.floor(hitRate * factor * 100);

  return clamp(
    hitProbability + getAbilityTotal(state.equippedItems, state.setBonuses, "hitrate", true),
    20,
    96
  );
}

function getLevelDamageMultiplier(attackerLevel: number, defenderLevel: number | null) {
  const reduceFactor = [
    1, 1, 0.98, 0.95, 0.91, 0.87, 0.81, 0.75, 0.67, 0.59, 0.51, 0.42, 0.32, 0.22, 0.12, 0.01
  ];
  const delta = (defenderLevel ?? attackerLevel) - attackerLevel;

  if (delta <= 0) {
    return 1;
  }

  return reduceFactor[Math.min(delta, reduceFactor.length - 1)] ?? 1;
}

export function getAutoAttackDamage(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  monster: MonsterFamilyVariant,
  equipmentSet = 0
): AutoAttackDamage {
  const state = getCombatState(character, itemsById, equipmentSet);
  const job = jobConstants[character.job] ?? jobConstants.Vagrant;
  const hitRange = getWeaponHitRange(
    state.mainhand,
    state.stats,
    state.level,
    job,
    state.equippedItems,
    state.setBonuses
  );
  let attack = Math.floor((hitRange.min + hitRange.max) / 2);
  attack = Math.floor(attack * (1 + getAbilityTotal(state.equippedItems, state.setBonuses, "attack", true) / 100));
  attack += getAbilityTotal(state.equippedItems, state.setBonuses, "attack");
  attack = Math.max(attack, 0);

  let damage = applyAttackDefense(attack, getMonsterDefense(monster));

  if (damage > 0) {
    const minCritical = state.level > (monster.level ?? state.level) ? 1.2 : 1.1;
    const maxCritical = state.level > (monster.level ?? state.level) ? 2 : 1.4;
    const criticalFactor = (minCritical + maxCritical) / 2;
    const criticalBonus = Math.max(0.1, 1 + state.criticalDamage / 100);
    const criticalDamage = Math.floor(criticalFactor * criticalBonus * damage);

    damage = Math.floor(lerp(damage, criticalDamage, state.criticalChance / 100));
    damage = Math.floor(damage * getBlockFactor(monster));
  } else {
    damage = 0;
  }

  damage = Math.floor(
    damage *
      (1 + Math.max(0, getAbilityTotal(state.equippedItems, state.setBonuses, "pvedamage", true)) / 100) *
      getLevelDamageMultiplier(state.level, monster.level)
  );

  const effectiveHitRate = getEffectiveHitRate(state, monster);
  const damagePerSecond = damage * job.hps * state.attackSpeed * (effectiveHitRate / 100);
  const monsterHp = monster.hp ?? 0;

  return {
    averageDamage: damage,
    damagePerSecond,
    effectiveHitRate,
    secondsToKill: monsterHp > 0 && damagePerSecond > 0 ? monsterHp / damagePerSecond : null
  };
}
