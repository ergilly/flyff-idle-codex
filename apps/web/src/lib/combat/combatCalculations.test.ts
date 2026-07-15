import {
  getAutoAttackDamage,
  getAutoAttackTiming,
  getEffectiveHitRate,
  rollMonsterAutoAttack,
  rollPlayerAutoAttack
} from "./attacks";
import { getCombatStats } from "./stats";
import type { Character, ItemMetadata, MonsterFamilyVariant } from "@/lib/api";

const emptyEquipment: Character["equipment"] = {
  ammo: null,
  boots: null,
  cloak: null,
  csBoots: null,
  csGloves: null,
  csHelm: null,
  csSuit: null,
  earringL: null,
  earringR: null,
  flying: null,
  gloves: null,
  helmet: null,
  mainhand: null,
  mask: null,
  necklace: null,
  offhand: null,
  ringL: null,
  ringR: null,
  suit: null
};

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Set Tester",
  gender: "male",
  job: "Billposter",
  progressionRank: "normal",
  level: 80,
  exp: 0,
  penya: 0,
  stats: { str: 30, sta: 30, dex: 30, int: 15 },
  skillLevels: {},
  equipment: emptyEquipment,
  inventory: { size: 50, items: [] }
};

function getStat(stats: ReturnType<typeof getCombatStats>, label: string) {
  const stat = stats.find((entry) => entry.label === label);

  if (!stat) {
    throw new Error(`Missing stat: ${label}`);
  }

  return stat.value;
}

function numberValue(value: string) {
  return Number(value.replace(/,/g, ""));
}

function percentValue(value: string) {
  return Number(value.replace("%", ""));
}

function itemWithAbilities(id: string, abilities: ItemMetadata["abilities"]): ItemMetadata {
  return {
    id,
    name: `Test Item ${id}`,
    description: null,
    icon: null,
    category: "accessory",
    subcategory: "ring",
    rarity: "common",
    level: 1,
    sex: null,
    requiredJob: null,
    minAttack: null,
    maxAttack: null,
    attackSpeed: null,
    twoHanded: null,
    minDefense: null,
    maxDefense: null,
    abilities
  };
}

function weapon(id: string, minAttack: number, maxAttack: number): ItemMetadata {
  return {
    id,
    name: `Test Weapon ${id}`,
    description: null,
    icon: null,
    category: "weapon",
    subcategory: "sword",
    rarity: "common",
    level: 1,
    sex: null,
    requiredJob: null,
    minAttack,
    maxAttack,
    attackSpeed: "veryfast",
    twoHanded: false,
    minDefense: null,
    maxDefense: null,
    abilities: []
  };
}

describe("combat calculations", () => {
  it("returns visible stats in a grouped display order", () => {
    expect(getCombatStats(character, {}).map((stat) => stat.label)).toEqual([
      "STR",
      "STA",
      "DEX",
      "INT",
      "Max HP",
      "Max MP",
      "Max FP",
      "Attack",
      "Magic Attack",
      "PvE Damage",
      "Critical Chance",
      "Critical Damage",
      "Attack Speed",
      "DCT",
      "Hit Rate",
      "Defense",
      "Magic DEF",
      "Critical Resist",
      "Melee Block",
      "Ranged Block",
      "Parry",
      "Reflect Damage",
      "HP Recovery After Kill",
      "MP Recovery After Kill"
    ]);
  });

  it("matches Flyffulator's mainhand-based displayed attack stat", () => {
    const itemsById = {
      mainhand: weapon("mainhand", 20, 30),
      offhand: weapon("offhand", 10, 20)
    };
    const mainhandOnlyStats = getCombatStats(
      {
        ...character,
        job: "Blade",
        equipment: {
          ...emptyEquipment,
          mainhand: "mainhand"
        }
      },
      itemsById
    );
    const dualWieldStats = getCombatStats(
      {
        ...character,
        job: "Blade",
        equipment: {
          ...emptyEquipment,
          mainhand: "mainhand",
          offhand: "offhand"
        }
      },
      itemsById
    );

    expect(numberValue(getStat(dualWieldStats, "Attack"))).toBe(
      numberValue(getStat(mainhandOnlyStats, "Attack"))
    );
  });

  it("uses Blade offhand weapon damage in auto attacks without changing displayed Attack", () => {
    const monster: MonsterFamilyVariant = {
      id: 1,
      name: "Aibatt",
      level: 80,
      rank: "normal",
      element: "none",
      icon: null,
      hp: 10_000,
      minAttack: 1,
      maxAttack: 1,
      defense: 0,
      magicDefense: 0,
      minDropGold: 0,
      maxDropGold: 0,
      drops: [],
      variantRank: "normal"
    };
    const mainhandOnlyCharacter: Character = {
      ...character,
      job: "Blade",
      equipment: {
        ...emptyEquipment,
        mainhand: "mainhand"
      }
    };
    const dualWieldCharacter: Character = {
      ...mainhandOnlyCharacter,
      equipment: {
        ...mainhandOnlyCharacter.equipment,
        offhand: "offhand"
      }
    };
    const itemsById = {
      mainhand: weapon("mainhand", 20, 20),
      offhand: weapon("offhand", 200, 200)
    };
    const rollSequence = (values: number[]) => {
      let index = 0;

      return () => values[index++] ?? 0.99;
    };
    const mainhandRoll = rollPlayerAutoAttack(
      mainhandOnlyCharacter,
      itemsById,
      monster,
      0,
      rollSequence([0, 0.99])
    );
    const offhandRoll = rollPlayerAutoAttack(
      dualWieldCharacter,
      itemsById,
      monster,
      0,
      rollSequence([0, 0, 0.99])
    );

    expect(numberValue(getStat(getCombatStats(dualWieldCharacter, itemsById), "Attack"))).toBe(
      numberValue(getStat(getCombatStats(mainhandOnlyCharacter, itemsById), "Attack"))
    );
    expect(offhandRoll.damage).toBeGreaterThan(mainhandRoll.damage);
    expect(getAutoAttackDamage(dualWieldCharacter, itemsById, monster).averageDamage).toBeGreaterThan(
      getAutoAttackDamage(mainhandOnlyCharacter, itemsById, monster).averageDamage
    );
  });

  it("applies active set bonuses from equipped set pieces", () => {
    const baseStats = getCombatStats(character, {});
    const twoPieceStats = getCombatStats(
      {
        ...character,
        equipment: {
          ...emptyEquipment,
          helmet: "3272",
          suit: "4351"
        }
      },
      {}
    );
    const threePieceStats = getCombatStats(
      {
        ...character,
        equipment: {
          ...emptyEquipment,
          helmet: "3272",
          suit: "4351",
          gloves: "822"
        }
      },
      {}
    );

    expect(numberValue(getStat(twoPieceStats, "Defense")) - numberValue(getStat(baseStats, "Defense"))).toBe(
      21
    );
    expect(
      numberValue(getStat(threePieceStats, "Defense")) - numberValue(getStat(baseStats, "Defense"))
    ).toBe(22);
    expect(getStat(baseStats, "Hit Rate")).toBe("20.0%");
    expect(getStat(threePieceStats, "Hit Rate")).toBe("22.5%");
    expect(percentValue(getStat(threePieceStats, "Attack Speed"))).toBeLessThanOrEqual(100);
  });

  it("uses the requested equipment set when calculating active set bonuses", () => {
    const stats = getCombatStats(
      {
        ...character,
        equipment: emptyEquipment,
        equipmentSets: [
          emptyEquipment,
          {
            ...emptyEquipment,
            helmet: "3272",
            suit: "4351"
          },
          emptyEquipment
        ]
      },
      {},
      1
    );

    expect(
      numberValue(getStat(stats, "Defense")) - numberValue(getStat(getCombatStats(character, {}), "Defense"))
    ).toBe(21);
  });

  it("uses Flyffulator stat-window caps for attack speed and DCT", () => {
    const stats = getCombatStats(
      {
        ...character,
        equipment: {
          ...emptyEquipment,
          ringL: "cap-ring"
        }
      },
      {
        "cap-ring": itemWithAbilities("cap-ring", [
          { parameter: "actionspeed", add: 500, rate: true },
          { parameter: "decreasedcastingtime", add: 500, rate: true },
          { parameter: "hitrate", add: 500, rate: true }
        ])
      }
    );

    expect(getStat(stats, "Attack Speed")).toBe("100%");
    expect(getStat(stats, "DCT")).toBe("200%");
    expect(getStat(stats, "Hit Rate")).toBe("507.5%");
  });

  it("applies the job critical multiplier before flooring", () => {
    const stats = getCombatStats(
      {
        ...character,
        job: "Jester",
        stats: { str: 15, sta: 15, dex: 15, int: 15 }
      },
      {}
    );

    expect(getStat(stats, "Critical Chance")).toBe("6%");
  });

  it("calculates live auto attack timing from attack speed", () => {
    const equippedCharacter: Character = {
      ...character,
      stats: { str: 30, sta: 30, dex: 5, int: 15 },
      equipment: {
        ...emptyEquipment,
        mainhand: "mainhand"
      }
    };
    const itemsById = {
      mainhand: { ...weapon("mainhand", 20, 30), attackSpeed: "normal" }
    };
    const stats = getCombatStats(equippedCharacter, itemsById);
    const timing = getAutoAttackTiming(equippedCharacter, stats, itemsById);
    const expectedSheetAttackSpeed = Math.min(100, 77 * 0.75 + Math.floor(5 * 0.06) * 4);
    const expectedAttacksPerSecond = 2.62 * (expectedSheetAttackSpeed / 100);

    expect(percentValue(getStat(stats, "Attack Speed"))).toBe(Math.round(expectedSheetAttackSpeed));
    expect(timing.attacksPerSecond).toBeCloseTo(expectedAttacksPerSecond);
    expect(timing.secondsPerAttack).toBeCloseTo(1 / expectedAttacksPerSecond);
  });

  it("calculates sheet attack speed from discrete dex speed breaks", () => {
    const equippedCharacter: Character = {
      ...character,
      job: "Vagrant",
      stats: { str: 15, sta: 15, dex: 15, int: 15 },
      equipment: {
        ...emptyEquipment,
        mainhand: "mainhand"
      }
    };
    const itemsById = {
      mainhand: { ...weapon("mainhand", 20, 30), attackSpeed: "fast" }
    };
    const baselineStats = getCombatStats(equippedCharacter, itemsById);
    const dexBuildStats = getCombatStats(
      {
        ...equippedCharacter,
        stats: { str: 15, sta: 15, dex: 60, int: 15 }
      },
      itemsById
    );

    expect(percentValue(getStat(baselineStats, "Attack Speed"))).toBeLessThan(100);
    expect(getStat(baselineStats, "Attack Speed")).toBe("58%");
    expect(getStat(dexBuildStats, "Attack Speed")).toBe("70%");
  });

  it("keeps low-level vagrant attacks slower than high-level blade attacks", () => {
    const vagrant: Character = {
      ...character,
      job: "Vagrant",
      level: 1,
      stats: { str: 15, sta: 15, dex: 15, int: 15 },
      equipment: {
        ...emptyEquipment,
        mainhand: "training-sword"
      }
    };
    const blade: Character = {
      ...character,
      job: "Blade",
      level: 120,
      stats: { str: 80, sta: 40, dex: 120, int: 15 },
      equipment: {
        ...emptyEquipment,
        mainhand: "blade-sword"
      }
    };
    const itemsById = {
      "blade-sword": weapon("blade-sword", 200, 220),
      "training-sword": { ...weapon("training-sword", 20, 30), twoHanded: true }
    };
    const vagrantTiming = getAutoAttackTiming(vagrant, getCombatStats(vagrant, itemsById), itemsById);
    const bladeTiming = getAutoAttackTiming(blade, getCombatStats(blade, itemsById), itemsById);

    expect(vagrantTiming.secondsPerAttack).toBeGreaterThan(bladeTiming.secondsPerAttack);
    expect(vagrantTiming.attacksPerSecond).toBeLessThan(bladeTiming.attacksPerSecond);
  });

  it("projects Flyffulator-style auto attack damage against a monster", () => {
    const monster: MonsterFamilyVariant = {
      id: 1,
      name: "Aibatt",
      level: 80,
      rank: "normal",
      element: "none",
      icon: null,
      hp: 10_000,
      minAttack: 1,
      maxAttack: 1,
      defense: 200,
      magicDefense: 0,
      minDropGold: 0,
      maxDropGold: 0,
      drops: [],
      variantRank: "normal"
    };
    const damage = getAutoAttackDamage(
      {
        ...character,
        equipment: {
          ...emptyEquipment,
          mainhand: "mainhand"
        }
      },
      {
        mainhand: weapon("mainhand", 20, 30)
      },
      monster
    );

    expect(damage.averageDamage).toBeGreaterThan(0);
    expect(damage.effectiveHitRate).toBeGreaterThanOrEqual(20);
    expect(damage.effectiveHitRate).toBeLessThanOrEqual(96);
    expect(
      getEffectiveHitRate(
        {
          ...character,
          equipment: {
            ...emptyEquipment,
            mainhand: "mainhand"
          }
        },
        {
          mainhand: weapon("mainhand", 20, 30)
        },
        monster
      )
    ).toBe(damage.effectiveHitRate);
    expect(damage.damagePerSecond).toBeGreaterThan(0);
    expect(damage.secondsToKill).toBeCloseTo(10_000 / damage.damagePerSecond);
  });

  it("rolls player auto attacks through hit and critical chances", () => {
    const monster: MonsterFamilyVariant = {
      id: 1,
      name: "Aibatt",
      level: 80,
      rank: "normal",
      element: "none",
      icon: null,
      hp: 10_000,
      minAttack: 1,
      maxAttack: 1,
      defense: 200,
      magicDefense: 0,
      minDropGold: 0,
      maxDropGold: 0,
      drops: [],
      variantRank: "normal"
    };
    const result = rollPlayerAutoAttack(
      {
        ...character,
        equipment: {
          ...emptyEquipment,
          mainhand: "mainhand"
        }
      },
      {
        mainhand: itemWithAbilities("mainhand", [{ parameter: "criticalchance", add: 100, rate: true }])
      },
      monster,
      0,
      () => 0
    );

    expect(result.isHit).toBe(true);
    expect(result.isCritical).toBe(true);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.effectiveHitRate).toBeGreaterThanOrEqual(20);
  });

  it("rolls monster auto attacks against character defenses", () => {
    const monster: MonsterFamilyVariant = {
      id: 1,
      name: "Aibatt",
      level: 80,
      rank: "normal",
      element: "none",
      icon: null,
      hp: 10_000,
      minAttack: 100,
      maxAttack: 120,
      defense: 200,
      magicDefense: 0,
      sta: 20,
      str: 15,
      dex: 300,
      int: 15,
      hitRate: 47,
      parry: 38,
      minDropGold: 0,
      maxDropGold: 0,
      drops: [],
      variantRank: "normal"
    };
    const result = rollMonsterAutoAttack(monster, character, getCombatStats(character, {}), () => 0);

    expect(result.isHit).toBe(true);
    expect(result.isCritical).toBe(true);
    expect(result.criticalChance).toBe(30);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.effectiveHitRate).toBeGreaterThanOrEqual(20);
  });

  it("keeps Flyffulator's minimum monster damage floor against players", () => {
    const monster: MonsterFamilyVariant = {
      id: 1,
      name: "Aibatt",
      level: 80,
      rank: "normal",
      element: "none",
      icon: null,
      hp: 10_000,
      minAttack: 100,
      maxAttack: 100,
      defense: 200,
      magicDefense: 0,
      sta: 20,
      str: 15,
      dex: 15,
      int: 15,
      hitRate: 47,
      parry: 38,
      minDropGold: 0,
      maxDropGold: 0,
      drops: [],
      variantRank: "normal"
    };
    const result = rollMonsterAutoAttack(
      monster,
      {
        ...character,
        stats: { str: 30, sta: 999, dex: 30, int: 15 }
      },
      getCombatStats({ ...character, stats: { str: 30, sta: 999, dex: 30, int: 15 } }, {}),
      () => 0.5
    );

    expect(result.isHit).toBe(true);
    expect(result.damage).toBe(10);
  });

  it("applies normalized equipment ability names and percentage defense bonuses", () => {
    const baseStats = getCombatStats(character, {});
    const stats = getCombatStats(
      {
        ...character,
        equipment: {
          ...emptyEquipment,
          ringL: "stat-ring"
        }
      },
      {
        "stat-ring": itemWithAbilities("stat-ring", [
          { parameter: "all_stats", add: 5, rate: false },
          { parameter: "max_hp", add: 100, rate: false },
          { parameter: "def", add: 10, rate: true },
          { parameter: "magic_defense", add: 10, rate: true },
          { parameter: "parry", add: 7, rate: false }
        ])
      }
    );

    expect(numberValue(getStat(stats, "STR")) - numberValue(getStat(baseStats, "STR"))).toBe(5);
    expect(numberValue(getStat(stats, "STA")) - numberValue(getStat(baseStats, "STA"))).toBe(5);
    expect(numberValue(getStat(stats, "DEX")) - numberValue(getStat(baseStats, "DEX"))).toBe(5);
    expect(numberValue(getStat(stats, "INT")) - numberValue(getStat(baseStats, "INT"))).toBe(5);
    expect(numberValue(getStat(stats, "Max HP"))).toBeGreaterThan(
      numberValue(getStat(baseStats, "Max HP")) + 100
    );
    expect(numberValue(getStat(stats, "Defense"))).toBeGreaterThan(
      numberValue(getStat(baseStats, "Defense"))
    );
    expect(numberValue(getStat(stats, "Magic DEF"))).toBeGreaterThan(
      numberValue(getStat(baseStats, "Magic DEF"))
    );
    expect(numberValue(getStat(stats, "Parry")) - numberValue(getStat(baseStats, "Parry"))).toBe(10);
  });

  it("keeps useful direct equipment stat bonuses visible and noisy bonuses hidden", () => {
    const stats = getCombatStats(
      {
        ...character,
        equipment: {
          ...emptyEquipment,
          ringL: "bonus-ring"
        }
      },
      {
        "bonus-ring": itemWithAbilities("bonus-ring", [
          { parameter: "magicattack", add: 50, rate: true },
          { parameter: "criticalresist", add: 8, rate: true },
          { parameter: "blockpenetration", add: 9, rate: true },
          { parameter: "skilldamage", add: 10, rate: true },
          { parameter: "skillchance", add: 11, rate: true },
          { parameter: "pvedamagereduction", add: 12, rate: true },
          { parameter: "pvpdamagereduction", add: 13, rate: true },
          { parameter: "healing", add: 14, rate: true },
          { parameter: "decreasedmpconsumption", add: 15, rate: true },
          { parameter: "decreasedfpconsumption", add: 16, rate: true },
          { parameter: "hprecoveryafterkill", add: 750, rate: false },
          { parameter: "mprecoveryafterkill", add: 250, rate: false },
          { parameter: "reflectdamage", add: 17, rate: true },
          { parameter: "arcaneinsightchance", add: 18, rate: true },
          { parameter: "ripostereflexchance", add: 19, rate: true },
          { parameter: "allelementsmastery", add: 20, rate: true },
          { parameter: "speed", add: 21, rate: true }
        ])
      }
    );

    expect(getStat(stats, "Magic Attack")).toBe("50%");
    expect(getStat(stats, "Critical Resist")).toBe("8%");
    expect(getStat(stats, "HP Recovery After Kill")).toBe("750");
    expect(getStat(stats, "MP Recovery After Kill")).toBe("250");
    expect(getStat(stats, "Reflect Damage")).toBe("17%");
    expect(stats.map((stat) => stat.label)).not.toEqual(
      expect.arrayContaining([
        "Skill Chance",
        "Block",
        "Block Penetration",
        "Skill Damage",
        "PvE Damage Reduction",
        "PvP Damage",
        "PvP Damage Reduction",
        "Healing",
        "MP Consumption",
        "FP Consumption",
        "Arcane Insight Chance",
        "Riposte Reflex Chance",
        "All Elements Mastery",
        "Move Speed"
      ])
    );
  });
});
