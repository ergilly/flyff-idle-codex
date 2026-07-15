import type { DamageTarget, ElementName, ElementValue, Monster } from "./types.js";

export default class Moverutils {
  static trainingDummy: DamageTarget & {
    defense: number;
    sta: number;
    levelScales: boolean;
    level: number;
  } = {
    defense: 133,
    sta: 1,
    levelScales: true,
    level: 0,
    parry: 0,
    hp: 1,
    magicDefense: 0,
    element: "none",
    resistFire: 0,
    resistWater: 0,
    resistEarth: 0,
    resistWind: 0,
    resistElectricity: 0
  };

  static AttackType = {
    AUTO_ATTACK: 0,
    MELEE_SKILL: 1,
    MAGIC_SKILL: 2,
    MAGIC_HIT: 3
  } as const;

  static AttackContext = {
    AC_PVE: "pve",
    AC_PVP: "pvp"
  } as const;

  static Elements = {
    none: 0,
    fire: 1,
    water: 2,
    electricity: 3,
    wind: 4,
    earth: 5
  } as const satisfies Record<ElementName, number>;

  static ATTACK_ELEMENT_FACTOR = 10000; // Factor unit for attack element.

  static getElementValue(element?: string): ElementValue {
    return this.Elements[element as ElementName] ?? this.Elements.none;
  }

  static lerp(start: number, end: number, amount: number): number {
    return (1 - amount) * start + amount * end;
  }

  static getDeltaFactor(opponentLevel: number, selfLevel: number): number {
    let deltaFactor = 1.0;
    let delta = opponentLevel - selfLevel;

    if (delta > 0) {
      const maxOver = 16;
      delta = Math.min(delta, maxOver - 1);
      const radian = (Math.PI * delta) / (maxOver * 2.0);
      deltaFactor *= Math.cos(radian);
    }

    return deltaFactor;
  }

  static calcMonsterDefense(monster: Pick<Monster, "level" | "defense" | "sta">, monsterLevel = 0): number {
    // TODO: None of this is correct for wand auto attacks specifically (magic auto attacks)
    // Would need to just use opponent.magicDefense / 7 + 1
    const staFactor = 0.75;
    const levelScale = 2.0 / 2.8;
    const statScale = 0.5 / 2.8;
    const level = monsterLevel == 0 ? monster.level : monsterLevel;
    const armor = monsterLevel == 0 ? monster.defense : (this.trainingDummy.defense * monsterLevel) / 100;

    // dwNaturalArmor / 4
    const equipmentDefense = armor / 4;

    let defense = Math.floor(
      level * levelScale + (monster.sta * statScale + (monster.sta - 14) * 1.0) * staFactor - 4
    );
    defense += equipmentDefense;

    defense = defense < 0 ? 0 : defense;
    return Math.floor(defense);
  }

  /**
   * Calculate the value to be subtracted from the attacker's attack at the end of damage calculation
   * @param defense defender's defense
   * @param attack attacker's attack
   */
  static calcDamageDefense(defense: number, attack: number): number {
    const factor = 2.0;
    let value = 0.0;

    const sum = defense + factor * attack;
    if (defense > 0 && sum > 1.0) {
      value = Math.sqrt(defense / sum);
    }

    const corr = Math.floor(this.lerp(defense, attack, value));
    return corr;
  }
}
