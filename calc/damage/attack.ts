import { DamageDefenseCalculator } from "./defense.js";
import Moverutils from "../moverutils.js";
import type { ElementValue } from "../types.js";

export abstract class DamageAttackCalculator extends DamageDefenseCalculator {
  computeAttack(): number {
    let attack = 0;
    // let count = 0;

    // Find attack based on the attack type
    switch (this.attackType) {
      case Moverutils.AttackType.MELEE_SKILL:
        attack = this.getMeleeSkillPower();
        break;
      case Moverutils.AttackType.MAGIC_SKILL:
        attack = this.getMagicSkillPower();
        break;
      case Moverutils.AttackType.MAGIC_HIT:
        attack = this.getMagicHitPower();
        break;
      case Moverutils.AttackType.AUTO_ATTACK:
        attack = this.getHitPower();
        break;
    }

    attack = Math.floor(attack * this.getAttackMultiplier());
    // if (count > 0) attack *= 0.1;
    // if (!isDamageOverTime()) {...}
    attack += this.attacker.getExtraParam("attack");

    return Math.max(attack, 0);
  }

  /**
   * Returns the power of a melee skill.
   */
  getMeleeSkillPower(): number {
    const skill = this.skill;
    if (!skill) return 0;

    // TODO: Allow customization of skill level
    const skillLevel = skill.levels.length - 1;
    const levelProp = skill.levels[skillLevel];
    if (!levelProp) return 0;

    const weaponAttack = this.getWeaponAttackPower();

    const referStat = this.getStatScale(
      skillLevel,
      levelProp,
      this.attackContext == Moverutils.AttackContext.AC_PVP
    );

    let powerMin: number;
    let powerMax: number;

    powerMin =
      ((weaponAttack[0] + (levelProp.minAttack + this.weapon.additionalSkillDamage) * 5 + referStat - 20) *
        (16 + skillLevel)) /
      13;
    powerMax =
      ((weaponAttack[1] + (levelProp.maxAttack + this.weapon.additionalSkillDamage) * 5 + referStat - 20) *
        (16 + skillLevel)) /
      13;

    const weaponDamage = this.attacker.getExtraParam(this.weapon.subcategory + "attack");

    powerMin = this.attacker.getExtraParam("damage") + Math.floor(powerMin) + weaponDamage;
    powerMax = this.attacker.getExtraParam("damage") + Math.floor(powerMax) + weaponDamage;

    const final = (powerMin + powerMax) / 2.0;

    return Math.max(Math.floor(final), 1);
  }

  /**
   * Returns the power of a magic skill.
   */
  getMagicSkillPower(): number {
    let attack = this.getMeleeSkillPower();
    const skill = this.skill;
    if (!skill) return 0;

    attack += (attack * this.attacker.getExtraParam("magicattack", true)) / 100.0;

    let bonus = 0;
    switch (skill.element) {
      case "fire":
        bonus = this.attacker.getExtraParam("firemastery", true);
        break;
      case "earth":
        bonus = this.attacker.getExtraParam("earthmastery", true);
        break;
      case "water":
        bonus = this.attacker.getExtraParam("watermastery", true);
        break;
      case "wind":
        bonus = this.attacker.getExtraParam("windmastery", true);
        break;
      case "electricity":
        bonus = this.attacker.getExtraParam("electricitymastery", true);
        break;
    }

    if (bonus != 0) {
      return Math.floor(attack * (1.0 + bonus / 100.0));
    }

    return attack;
  }

  /**
   * Returns the power of a magic hit.
   */
  getMagicHitPower(): number {
    const minMax = this.getWeaponAttackPower();
    const attack = this.getWeaponAttack("wand");

    minMax[0] += attack;
    minMax[1] += attack;

    let damage = Math.floor((minMax[0] + minMax[1]) / 2.0);
    damage += this.attacker.getExtraParam("damage");

    const wandChargeFactor = 0.6; // This is the factor at 0 charge
    damage = Math.floor(damage * wandChargeFactor);
    return damage;
  }

  /**
   * Returns the power of regular hit.
   */
  getHitPower(): number {
    const attackFactor = this.getDamagePropertyFactor();

    const minmax = this.getHitMinMax();
    let attack = Math.floor((minmax[0] + minmax[1]) / 2);
    attack = Math.floor((attack * attackFactor) / Moverutils.ATTACK_ELEMENT_FACTOR);

    return attack;
  }

  /**
   * Returns the min and max hit.
   */
  getHitMinMax(): [number, number] {
    let min = this.weapon.minAttack * 2;
    let max = this.weapon.maxAttack * 2;

    // Not used in anything right now
    // min += this.attacker.getExtraParam("minability");
    // max += this.attacker.getExtraParam("maxability");

    const plus = this.getWeaponAttack(this.weapon.subcategory) + this.attacker.getExtraParam("damage");
    min += plus;
    max += plus;

    const factor = this.getWeaponMultiplier();
    min = Math.floor(min * factor);
    max = Math.floor(max * factor);

    if (this.attacker.mainhandUpgrade > 0) {
      const value = Math.floor(Math.pow(this.attacker.mainhandUpgrade, 1.5));
      min += value;
      max += value;
    }

    // Spirit strike / Heart of Fury
    const spiritStrike = this.attacker.getExtraParam("spiritstrike", true);
    if (spiritStrike > 0) {
      const bonus = (spiritStrike * this.attacker.fp) / 100.0;
      min += bonus;
      max += bonus;
    }

    return [min, max];
  }

  /**
   * Returns the attack and defense factors.
   */
  getDamagePropertyFactor(): number {
    let attackFactor = Moverutils.ATTACK_ELEMENT_FACTOR;
    this.defenseFactor = Moverutils.ATTACK_ELEMENT_FACTOR;

    // Attacker element stuff
    let attackType: ElementValue = Moverutils.Elements.none;
    let attackLevel = 0;
    const plusAttack = 0;

    if (this.attacker.mainhandElement != Moverutils.Elements.none) {
      // Weapon element upgrade
      attackType = this.attacker.mainhandElement;
      attackLevel = this.attacker.mainhandElementUpgrade + this.attacker.getExtraParam("elementattack");
    } else {
      // Inherent element
      attackType = Moverutils.getElementValue(this.attacker.mainhand.element);
    }

    // plusAttack = getElementAdditionalAttack(part);

    // Defender element stuff
    let defenseType: ElementValue = Moverutils.Elements.none;
    let defenseLevel = 0;
    const plusDefense = 0;

    if (this.attackContext == Moverutils.AttackContext.AC_PVE) {
      defenseType = Moverutils.getElementValue(this.defender.element);
      defenseLevel = 1; // monster element attack, usually 1
    }

    if (attackType == Moverutils.Elements.none && defenseType == Moverutils.Elements.none) {
      return attackFactor;
    }

    const Relation = {
      None: 0, // One has no element.
      Same: 1, // Same element.
      Weak: 2, // Attacker element is weak.
      Strong: 3 // Attacker element is strong.
    };

    // Element matchup table
    const table = [
      [Relation.None, Relation.None, Relation.None, Relation.None, Relation.None, Relation.None],
      [Relation.None, Relation.Same, Relation.Weak, Relation.None, Relation.Strong, Relation.None],
      [Relation.None, Relation.Strong, Relation.Same, Relation.Weak, Relation.None, Relation.None],
      [Relation.None, Relation.None, Relation.Strong, Relation.Same, Relation.None, Relation.Weak],
      [Relation.None, Relation.Weak, Relation.None, Relation.None, Relation.Same, Relation.Strong],
      [Relation.None, Relation.None, Relation.None, Relation.Strong, Relation.Weak, Relation.Same]
    ];

    const result = table[attackType]?.[defenseType] ?? Relation.None;

    let factor = 0;
    let level = 0;

    // Bonus attack based on upgrade levels
    const upgradeFactors = {
      attackDamage: [5.0, 5.22, 5.6, 6.12, 6.8, 7.63, 8.6, 9.73, 11.01, 12.44],
      damage: [2, 2.21, 2.56, 3.05, 3.68, 4.46, 5.37, 6.42, 7.61, 8.95]
    };

    switch (result) {
      case Relation.Weak:
        level = attackLevel - 5 - defenseLevel;
        this.defenseFactor += plusDefense;
        break;
      case Relation.Strong:
        level = attackLevel - (defenseLevel > 5 ? defenseLevel - 5 : 0);
        if (level > 0) {
          factor += upgradeFactors.attackDamage[Math.min(level, 10) - 1];
        }
        attackFactor += plusAttack;
        break;
      default:
        if (attackLevel > 0 && defenseLevel == 0) {
          factor += upgradeFactors.damage[Math.min(attackLevel, 10) - 1];
        } else if (attackLevel == 0 && defenseLevel > 0) {
          const lvl = defenseLevel - 3;
          if (lvl <= 0) {
            factor -= 0;
          } else {
            factor -= upgradeFactors.damage[Math.min(lvl, 10) - 1];
          }
        } else if (attackLevel > 0 && defenseLevel > 0) {
          level = attackLevel - defenseLevel;
        }
        break;
    }

    if (level != 0) {
      if (level > 0) {
        factor += upgradeFactors.damage[Math.min(level, 10) - 1];
      } else {
        factor -= upgradeFactors.damage[Math.min(-level, 10) - 1];
      }
    }

    attackFactor += factor;
    this.defenseFactor += factor;

    return attackFactor;
  }

  /**
   * Returns the attack power multiplier for the current attack.
   */
  getAttackMultiplier(): number {
    let sumPower = this.attacker.getExtraParam("attack", true);
    const achievementBonus = 0; // Assuming you have level one achievement

    if (this.isSkill) {
      sumPower += this.attacker.getExtraParam("skilldamage", true);
    }

    if (this.attackContext == Moverutils.AttackContext.AC_PVE) {
      sumPower += achievementBonus;
      sumPower += Math.max(0, this.attacker.getExtraParam("pvedamage", true));
    } else {
      sumPower += Math.max(0, this.attacker.getExtraParam("pvpdamage", true));
    }

    let factor = 1.0 + sumPower / 100.0;
    // Upcut stone
    if (this.attacker.activePremiumItems.find((buff) => buff.id == 8691 && buff.enabled)) {
      factor *= 1.2;
    }

    return factor;
  }

  /**
   * Returns the attack for the specified weapon type.
   */
  getWeaponAttack(type: string): number {
    let levelFactor = 0;
    let statValue = 0;
    let addValue = 0;
    let statMultiplier = this.attacker.constants.sword;

    switch (type) {
      case "sword":
        statMultiplier = this.attacker.constants.sword;
        levelFactor = 1.1;
        statValue = this.attacker.str - 12;
        break;
      case "yoyo":
        statMultiplier = this.attacker.constants.yoyo;
        levelFactor = 1.1;
        statValue = this.attacker.str - 12;
        break;
      case "axe":
        statMultiplier = this.attacker.constants.axe;
        levelFactor = 1.2;
        statValue = this.attacker.str - 12;
        break;
      case "staff":
        statMultiplier = this.attacker.constants.staff;
        levelFactor = 1.1;
        statValue = this.attacker.str - 10;
        break;
      case "stick":
        statMultiplier = this.attacker.constants.stick;
        levelFactor = 1.3;
        statValue = this.attacker.str - 10;
        break;
      case "knuckle":
        statMultiplier = this.attacker.constants.knuckle;
        levelFactor = 1.2;
        statValue = this.attacker.str - 10;
        break;
      case "wand":
        statMultiplier = this.attacker.constants.wand;
        levelFactor = 1.2;
        statValue = this.attacker.int - 10;
        break;
      case "bow":
        statMultiplier = this.attacker.constants.bow ?? this.attacker.constants.sword;
        levelFactor = 0.91;
        statValue = this.attacker.dex - 14;
        addValue = 0.14 * this.attacker.str;
        break;
      default:
        levelFactor = 1.1;
        statValue = this.attacker.str - 10;
        break;
    }

    const plusAttack = this.attacker.getExtraParam(type + "attack");
    const statAttack = statValue * statMultiplier;
    const levelAttack = this.attacker.level * levelFactor;

    const attack = plusAttack + Math.floor(statAttack + levelAttack + addValue);
    return attack;
  }

  /**
   * Calculate and return Asal damage.
   */
  computeAsalraalaikumDamage(): number {
    const skill = this.skill;
    if (!skill) return 0;
    const skillLevel = skill.levels.length;
    let add: number;

    switch (skillLevel) {
      case 1:
        add = 20;
        break;
      case 2:
        add = 30;
        break;
      case 3:
        add = 40;
        break;
      case 4:
        add = 50;
        break;
      case 5:
        add = 60;
        break;
      case 6:
        add = 70;
        break;
      case 7:
        add = 80;
        break;
      case 8:
        add = 90;
        break;
      case 9:
        add = 100;
        break;
      case 10:
        add = 150;
        break;
      default:
        return 0;
    }

    const mana = Math.floor(this.attacker.mp);
    return Math.floor(this.attacker.str / 10) * skillLevel * (5 + Math.floor(mana / 10)) + add;
  }

  /**
   * Returns the attack power of the currently equipped weapon.
   */
  getWeaponAttackPower(): [number, number] {
    let f = 1.0;
    let add = 0;

    const upgrade = this.attacker.mainhandUpgrade;
    if (upgrade > 0) {
      add = Math.floor(Math.pow(upgrade, 1.5));
    }

    f = this.getWeaponMultiplier();

    const power: [number, number] = [this.weapon.minAttack, this.weapon.maxAttack];
    // If the attacker is a monster, this is where we add its min and max attack to power

    power[0] *= f;
    power[1] *= f;
    power[0] += add;
    power[1] += add;

    return power;
  }

  /**
   * Returns the attack multiplier for the currently equipped weapon.
   */
  getWeaponMultiplier(): number {
    let value = 1.0;
    let upgrade = this.attacker.mainhandUpgrade;

    if (this.weapon.rarity == "ultimate") {
      upgrade = 10;
    }

    if (upgrade > 0) {
      value += (value * (this.attacker.mainhandUpgradeBonus?.weaponAttack ?? 0)) / 100.0;
    }

    return value;
  }

  /**
   * Returns the scaled attack for this skill.
   */
}
