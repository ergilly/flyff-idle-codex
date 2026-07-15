import { type Character, type ItemMetadata, type MonsterFamilyVariant } from "@/lib/api";
import { jobConstants } from "@/lib/combat/constants";
import {
  clamp,
  getAbilityTotal,
  getCombatState,
  getCombatStatValue,
  getEquipmentDefense,
  getMaxWeaponHitsPerSecond,
  getWeaponHitRange,
  parseNumber,
  parsePercent
} from "@/lib/combat/stats";
import {
  type AttackTiming,
  type AutoAttackDamage,
  type AutoAttackResult,
  type CombatState,
  type CombatStat,
  type JobCombatConstants
} from "@/lib/combat/types";

export function getAutoAttackTiming(
  character: Character,
  combatStats: CombatStat[],
  itemsById: Record<string, ItemMetadata> = {},
  equipmentSet = 0
): AttackTiming {
  const hasItemData = Object.keys(itemsById).length > 0;
  const attacksPerSecond = Math.max(
    0,
    hasItemData
      ? getCombatState(character, itemsById, equipmentSet).attackSpeed
      : getMaxWeaponHitsPerSecond(undefined) *
          (parsePercent(getCombatStatValue(combatStats, "Attack Speed")) / 100)
  );

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
  return Math.max(monster.parry ?? monster.level ?? 0, 1);
}

function getBlockFactor(monster: MonsterFamilyVariant) {
  const blockRate = Math.max(Math.floor((getMonsterParry(monster) - (monster.level ?? 0)) * 0.5), 0);

  return 1 - blockRate / 100 + 0.15 * (blockRate / 100);
}

function getEffectiveHitRateFromState(state: CombatState, monster: MonsterFamilyVariant) {
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

function getMonsterEffectiveHitRate(
  monster: MonsterFamilyVariant,
  character: Character,
  combatStats: CombatStat[]
) {
  const monsterLevel = monster.level ?? character.level;
  const parry = parseNumber(getCombatStatValue(combatStats, "Parry"));
  const monsterHitRate = monster.hitRate ?? monster.dex ?? monsterLevel;
  const factor = 1.5 * 2 * ((monsterLevel * 0.5) / (monsterLevel + character.level * 0.3));
  const hitRate = monsterHitRate / (monsterHitRate + parry);
  const hitProbability = Math.floor(hitRate * factor * 100);

  return clamp(hitProbability, 20, 96);
}

function getIncomingAutoAttackDefense(
  character: Character,
  combatStats: CombatStat[],
  itemsById?: Record<string, ItemMetadata>,
  equipmentSet = 0
) {
  if (itemsById) {
    const state = getCombatState(character, itemsById, equipmentSet);
    const job = jobConstants[character.job] ?? jobConstants.Vagrant;
    const baseDefense = Math.floor(
      character.level * (2 / 2.8) +
        (state.stats.sta * (0.5 / 2.8) + (state.stats.sta - 14) * job.def) * 0.75 -
        4
    );
    const defense =
      baseDefense +
      Math.floor(getEquipmentDefense(state.equippedItems) / 4) +
      getAbilityTotal(state.equippedItems, state.setBonuses, "def");

    return Math.max(
      0,
      Math.floor(defense * (1 + getAbilityTotal(state.equippedItems, state.setBonuses, "def", true) / 100))
    );
  }

  const displayedDefense = parseNumber(getCombatStatValue(combatStats, "Defense"));
  const sta = parseNumber(getCombatStatValue(combatStats, "STA")) || character.stats.sta;
  const baseDefense = Math.floor(character.level * (2 / 2.8) + (sta * (0.5 / 2.8) + (sta - 14)) * 0.75 - 4);

  return Math.max(0, Math.floor(baseDefense + displayedDefense / 4));
}

function getMonsterCriticalChance(monster: MonsterFamilyVariant, combatStats: CombatStat[]) {
  const monsterDex = monster.dex ?? 0;
  const criticalChance = Math.max(monsterDex / 10, 0);
  const criticalResistFactor = Math.min(
    1,
    Math.max(0, 1 - parsePercent(getCombatStatValue(combatStats, "Critical Resist")) / 100)
  );

  return criticalChance * criticalResistFactor;
}

function getRolledMonsterCriticalDamage(
  monster: MonsterFamilyVariant,
  character: Character,
  damage: number,
  random: () => number
) {
  let minCritical = 1.1;
  let maxCritical = 1.4;

  if ((monster.level ?? character.level) > character.level) {
    minCritical = 1.4;
    maxCritical = 1.8;
  }

  return Math.floor(lerp(minCritical, maxCritical, random()) * damage);
}

function getPlayerBlockChance(
  character: Character,
  monster: MonsterFamilyVariant,
  combatStats: CombatStat[],
  itemsById?: Record<string, ItemMetadata>,
  equipmentSet = 0
) {
  const job = jobConstants[character.job] ?? jobConstants.Vagrant;
  const monsterLevel = monster.level ?? character.level;
  const characterDex = parseNumber(getCombatStatValue(combatStats, "DEX")) || character.stats.dex;
  const monsterDex = monster.dex ?? 15;
  const blockLevel = character.level / ((character.level + monsterLevel) * 15);
  const blockDex = Math.min((characterDex + monsterDex + 2) * ((characterDex - monsterDex) / 800), 10);
  const blockBase = Math.max(blockLevel + blockDex, 0);
  const blockJob = (characterDex / 8) * job.block;
  const blockBonus =
    itemsById !== undefined
      ? getPlayerBlockBonus(character, itemsById, equipmentSet)
      : parsePercent(getCombatStatValue(combatStats, "Melee Block"));
  let blockRate = Math.floor(blockJob + blockBase + blockBonus);
  const rank = monster.rank?.toLowerCase() ?? monster.variantRank;

  if (rank === "giant" || rank === "violet") {
    blockRate /= 2;
  }

  return Math.max(0, blockRate);
}

function getPlayerBlockBonus(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  equipmentSet: number
) {
  const state = getCombatState(character, itemsById, equipmentSet);

  return (
    getAbilityTotal(state.equippedItems, state.setBonuses, "block", true) +
    getAbilityTotal(state.equippedItems, state.setBonuses, "meleeblock", true)
  );
}

function getPlayerBlockFactor(
  character: Character,
  monster: MonsterFamilyVariant,
  combatStats: CombatStat[],
  random: () => number,
  itemsById?: Record<string, ItemMetadata>,
  equipmentSet = 0
) {
  const roll = Math.floor(random() * 80);

  if (roll <= 5) {
    return 1;
  }

  if (roll >= 75 || getPlayerBlockChance(character, monster, combatStats, itemsById, equipmentSet) > roll) {
    return 0.2;
  }

  return 1;
}

export function getEffectiveHitRate(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  monster: MonsterFamilyVariant,
  equipmentSet = 0
) {
  return getEffectiveHitRateFromState(getCombatState(character, itemsById, equipmentSet), monster);
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

function isWeapon(item: ItemMetadata | undefined) {
  return item?.category === "weapon" && item.minAttack !== null && item.maxAttack !== null;
}

function canRollBladeOffhand(character: Character, state: CombatState) {
  return character.job === "Blade" && isWeapon(state.offhand);
}

function getAutoAttackBaseDamage(
  state: CombatState,
  monster: MonsterFamilyVariant,
  job: JobCombatConstants,
  weapon = state.mainhand,
  damageMultiplier = 1
) {
  const hitRange = getWeaponHitRange(
    weapon,
    state.stats,
    state.level,
    job,
    state.equippedItems,
    state.setBonuses
  );
  let attack = Math.floor((hitRange.min + hitRange.max) / 2);

  attack = Math.floor(
    attack * (1 + getAbilityTotal(state.equippedItems, state.setBonuses, "attack", true) / 100)
  );
  attack += getAbilityTotal(state.equippedItems, state.setBonuses, "attack");
  attack = Math.max(attack, 0);

  let damage = applyAttackDefense(attack, getMonsterDefense(monster));

  if (damage > 0) {
    damage = Math.floor(damage * getBlockFactor(monster));
  } else {
    damage = 0;
  }

  return Math.floor(
    damage *
      damageMultiplier *
      (1 + Math.max(0, getAbilityTotal(state.equippedItems, state.setBonuses, "pvedamage", true)) / 100) *
      getLevelDamageMultiplier(state.level, monster.level)
  );
}

function getAverageAutoAttackBaseDamage(
  character: Character,
  state: CombatState,
  monster: MonsterFamilyVariant,
  job: JobCombatConstants
) {
  const mainhandDamage = getAutoAttackBaseDamage(state, monster, job);

  if (!canRollBladeOffhand(character, state)) {
    return mainhandDamage;
  }

  const offhandDamage = getAutoAttackBaseDamage(state, monster, job, state.offhand, 0.75);

  return Math.floor(lerp(mainhandDamage, offhandDamage, 0.25));
}

function getAverageCriticalDamage(state: CombatState, monster: MonsterFamilyVariant, damage: number) {
  const minCritical = state.level > (monster.level ?? state.level) ? 1.2 : 1.1;
  const maxCritical = state.level > (monster.level ?? state.level) ? 2 : 1.4;
  const criticalFactor = (minCritical + maxCritical) / 2;
  const criticalBonus = Math.max(0.1, 1 + state.criticalDamage / 100);

  return Math.floor(criticalFactor * criticalBonus * damage);
}

function getRolledCriticalDamage(
  state: CombatState,
  monster: MonsterFamilyVariant,
  damage: number,
  random: () => number
) {
  const minCritical = state.level > (monster.level ?? state.level) ? 1.2 : 1.1;
  const maxCritical = state.level > (monster.level ?? state.level) ? 2 : 1.4;
  const criticalFactor = lerp(minCritical, maxCritical, random());
  const criticalBonus = Math.max(0.1, 1 + state.criticalDamage / 100);

  return Math.floor(criticalFactor * criticalBonus * damage);
}

export function getAutoAttackDamage(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  monster: MonsterFamilyVariant,
  equipmentSet = 0
): AutoAttackDamage {
  const state = getCombatState(character, itemsById, equipmentSet);
  const job = jobConstants[character.job] ?? jobConstants.Vagrant;
  const baseDamage = getAverageAutoAttackBaseDamage(character, state, monster, job);
  const criticalChance = clamp(state.criticalChance, 0, 100);
  const criticalDamage = getAverageCriticalDamage(state, monster, baseDamage);
  const damage = Math.floor(lerp(baseDamage, criticalDamage, criticalChance / 100));
  const effectiveHitRate = getEffectiveHitRateFromState(state, monster);
  const damagePerSecond = damage * state.attackSpeed * (effectiveHitRate / 100);
  const monsterHp = monster.hp ?? 0;

  return {
    averageDamage: damage,
    damagePerSecond,
    effectiveHitRate,
    secondsToKill: monsterHp > 0 && damagePerSecond > 0 ? monsterHp / damagePerSecond : null
  };
}

export function rollPlayerAutoAttack(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  monster: MonsterFamilyVariant,
  equipmentSet = 0,
  random: () => number = Math.random
): AutoAttackResult {
  const state = getCombatState(character, itemsById, equipmentSet);
  const job = jobConstants[character.job] ?? jobConstants.Vagrant;
  const effectiveHitRate = getEffectiveHitRateFromState(state, monster);
  const criticalChance = clamp(state.criticalChance, 0, 100);
  const isHit = random() * 100 < effectiveHitRate;

  if (!isHit) {
    return {
      criticalChance,
      damage: 0,
      effectiveHitRate,
      isCritical: false,
      isHit: false
    };
  }

  const rollOffhand = canRollBladeOffhand(character, state) && random() * 100 < 25;
  const baseDamage = getAutoAttackBaseDamage(
    state,
    monster,
    job,
    rollOffhand ? state.offhand : state.mainhand,
    rollOffhand ? 0.75 : 1
  );
  const isCritical = random() * 100 < criticalChance;

  return {
    criticalChance,
    damage: isCritical ? getRolledCriticalDamage(state, monster, baseDamage, random) : baseDamage,
    effectiveHitRate,
    isCritical,
    isHit
  };
}

export function rollMonsterAutoAttack(
  monster: MonsterFamilyVariant,
  character: Character,
  combatStats: CombatStat[],
  random: () => number = Math.random,
  itemsById?: Record<string, ItemMetadata>,
  equipmentSet = 0
): AutoAttackResult {
  const monsterLevel = monster.level ?? character.level;
  const defense = getIncomingAutoAttackDefense(character, combatStats, itemsById, equipmentSet);
  const effectiveHitRate = getMonsterEffectiveHitRate(monster, character, combatStats);
  const criticalChance = getMonsterCriticalChance(monster, combatStats);
  const isHit = random() * 100 < effectiveHitRate;

  if (!isHit) {
    return {
      criticalChance,
      damage: 0,
      effectiveHitRate,
      isCritical: false,
      isHit: false
    };
  }

  const minAttack = monster.minAttack ?? 1;
  const maxAttack = Math.max(minAttack, monster.maxAttack ?? minAttack);
  let rolledAttack = Math.floor(lerp(minAttack, maxAttack, random()));
  const levelDelta = monsterLevel - character.level;

  if (levelDelta > 0) {
    rolledAttack = Math.floor(rolledAttack * (1 + 0.05 * levelDelta));
  }

  let damage = Math.max(0, applyAttackDefense(rolledAttack, defense));
  const isCritical = random() * 100 < criticalChance;

  if (damage > 0 && isCritical) {
    damage = getRolledMonsterCriticalDamage(monster, character, damage, random);
  }

  const blockFactor =
    damage > 0 ? getPlayerBlockFactor(character, monster, combatStats, random, itemsById, equipmentSet) : 1;

  if (blockFactor < 1) {
    damage = Math.floor(damage * blockFactor);
  }

  damage = Math.max(damage, Math.floor(rolledAttack * 0.1));

  return {
    criticalChance,
    damage,
    effectiveHitRate,
    isCritical,
    isHit
  };
}
