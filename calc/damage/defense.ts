import { DamageCalculatorBase } from "./base.js";
import { Utils } from "../utils.js";
import Moverutils from "../moverutils.js";
import { Blade, Knight } from "../jobs.js";
import type { ElementValue } from "../types.js";

export abstract class DamageDefenseCalculator extends DamageCalculatorBase {
  applyDefense(attack: number): number {
    // if forced attack return attack, no defense

    let damage = attack;

    // Defense formula based on the type of attack
    switch (this.attackType) {
      case Moverutils.AttackType.MAGIC_SKILL:
        damage = this.applyMagicSkillDefense(attack);
        break;
      case Moverutils.AttackType.AUTO_ATTACK:
        damage = this.applyGenericDefense(attack);
        break;
      default: // Melee skills
        damage = this.applyDefenseParryCritical(attack);
        if (damage > 0) {
          damage += this.getElementDamage();
        }
        break;
    }

    damage = this.applyElementDefense(damage);

    if (this.skill) {
      if (this.skill.id == 5041) {
        // Asal formula
        if (damage > 0) {
          damage += this.computeAsalraalaikumDamage();
        } else {
          damage = this.computeAsalraalaikumDamage();
        }
      }
    }

    if (damage <= 0) {
      return 0;
    }

    // TODO: Enable link attack calculations
    // damage += computePartyLinkDamage(damage);
    damage = Math.floor(damage * this.getDamageMultiplier());

    // Process events after we have final damage
    damage = this.afterDamage(damage);

    return damage;
  }

  /**
   * Returns the effective hit rate in this fight.
   */
  getHitRate(): number {
    if (this.attackType != Moverutils.AttackType.AUTO_ATTACK) {
      return 100;
    }

    const defenderLevel = this.defender.level ?? this.attacker.level;
    const factor = 1.6 * 1.5 * ((this.attacker.level * 1.2) / (this.attacker.level + defenderLevel));
    const attackerHitRate = this.attacker.dex;
    const defenderParryRate = this.defender.parry ?? 0;
    const hitRate = attackerHitRate / (attackerHitRate + defenderParryRate);
    const hitProb = Math.floor(hitRate * factor * 100.0);

    return Utils.clamp(hitProb + this.attacker.getExtraParam("hitrate", true), 20, 96);
  }

  /**
   * Return any applicable damage multipliers for the current attack.
   */
  getDamageMultiplier(): number {
    let factor = 1.0;
    //let probability = 0.0;

    if (this.skill) {
      const skillLevel = this.skill.levels.length;
      const skillLevelProp = this.skill.levels[skillLevel - 1];
      if (!skillLevelProp) return factor;
      const probability = skillLevelProp.probability ?? 0;

      if (skillLevelProp.damageMultiplier != undefined) {
        factor = skillLevelProp.damageMultiplier;
      }

      if (skillLevelProp.probability != undefined) {
        //probability = skillLevelProp.probability;
      }

      // if (skillLevelProp.skillCount)

      // Vital Stab / Silent Shot
      if (this.skill.id == 5162 || this.skill.id == 8916) {
        if (this.attacker.hasBuff(7395))
          // Dark Illusion
          factor *= 1.4;
      }

      switch (this.skill.id) {
        case 5162: // Vital Stab
          // Double damage 60% of the time = 1.6
          factor *= 1 - probability / 100.0 + 2 * (probability / 100.0);
          break;
        case 6910: // Aimed Shot
        case 9538: // Spring Attack
          factor = 1 - probability / 100.0 + 2 * (probability / 100.0);
          break;
        case 1526: // Junk Arrow
          factor *= probability / 100.0;
          factor *= 4; // Hits 4 times
          break;
        case 7156: // Hit of Penya
          factor *= 4; // skillLevelProp->destData[0] / 100
          break;
      }

      // TODO: Skill awake bonuses
    }

    // Blade 0.75x damage if hitting with left hand
    if (this.attacker instanceof Blade) {
      factor *= this.getAverageChanceMultiplier(25, 0.75);
    }

    // Sword cross multiplier
    if (this.attacker instanceof Knight && this.weapon.triggerSkillProbability != undefined) {
      factor *= this.getAverageChanceMultiplier(this.weapon.triggerSkillProbability, 2.0);
    }

    // Level difference reductions
    let delta = (this.defender.level ?? this.attacker.level) - this.attacker.level;
    if (delta > 0) {
      const reduceFactor = [
        1.0, 1.0, 0.98, 0.95, 0.91, 0.87, 0.81, 0.75, 0.67, 0.59, 0.51, 0.42, 0.32, 0.22, 0.12, 0.01
      ];

      delta = Math.min(delta, reduceFactor.length - 1);
      factor *= reduceFactor[delta];
    }

    return factor;
  }

  /**
   * Calculations after main damage computation.
   */
  afterDamage(damage: number): number {
    if (this.skill?.id == 1947) {
      // Reflex hit
      //const skillLevel = this.skill.levels.length;
      //const reflexPercent = 100; // destData[0]
      // TODO: Reflex hit damage addition
    }

    return damage;
  }

  /**
   * Return the generic defense. (for auto attacks)
   */
  applyGenericDefense(attack: number): number {
    let defense = this.computeDefense();
    defense = Math.floor((defense * this.defenseFactor) / Moverutils.ATTACK_ELEMENT_FACTOR);

    let damage = this.applyAttackDefense(attack, defense);

    if (damage > 0) {
      // Critical damage stuff
      const criticalChance = this.getCriticalProbability();
      let minCritical = 1.1;
      let maxCritical = 1.4;

      if (this.attacker.level > (this.defender.level ?? this.attacker.level)) {
        minCritical = 1.2;
        maxCritical = 2.0;
      }

      const criticalFactor = (minCritical + maxCritical) / 2.0;
      const criticalBonus = Math.max(0.1, 1.0 + this.attacker.getExtraParam("criticaldamage", true) / 100.0);
      const criticalDamage = Math.floor(criticalFactor * criticalBonus * damage);

      damage = Math.floor(Utils.lerp(damage, criticalDamage, criticalChance / 100));

      // Block stuff
      const blockFactor = this.getBlockFactor();
      if (blockFactor < 1.0) {
        damage = Math.floor(damage * blockFactor);
      }
    } else {
      damage = 0;
    }

    // TODO: Monster attacking player stuff here...

    return damage;
  }

  /**
   * Returns the block factor of the defender.
   */
  getBlockFactor(): number {
    // For monsters only
    // 5% of the time factor = 1
    // 5% of the time factor = 0.1
    // 90% of the time it does the full calculation
    const minBlock = 0.1;
    const regularBlock = 0.2;
    let factor = 1.0;

    let blockRate = Math.floor(((this.defender.parry ?? 0) - (this.defender.level ?? 0)) * 0.5);
    blockRate = Math.max(blockRate, 0);

    // This is the average multiplier you get on your damage in terms of blocking
    factor = 1 - blockRate / 100.0 + ((minBlock + regularBlock) / 2.0) * (blockRate / 100.0);

    return factor;
  }

  /**
   * Returns element resistance defense.
   */
  applyElementDefense(attack: number): number {
    let damage = attack;

    let skillElement: ElementValue = Moverutils.Elements.none;
    if (this.skill) {
      skillElement = Moverutils.getElementValue(this.skill.element);
    }

    // Get the weapon element
    let weaponElement: ElementValue = Moverutils.Elements.none;
    if (this.attacker.mainhandElement != Moverutils.Elements.none) {
      weaponElement = this.attacker.mainhandElement;
    } else if (this.weapon.element) {
      weaponElement = Moverutils.getElementValue(this.weapon.element);
    }

    const attackerElement = skillElement != Moverutils.Elements.none ? skillElement : weaponElement;

    damage = Math.floor(attack * (1.0 - this.getElementResist(attackerElement)));

    if (skillElement != Moverutils.Elements.none) {
      // Apply more damage if the skill and weapon match elements
      if (skillElement == weaponElement) {
        return Math.floor(damage * 1.1);
      }

      // 10% less damage if the weapon's element is weak compared to the skill
      if (
        (weaponElement == Moverutils.Elements.water && skillElement == Moverutils.Elements.fire) ||
        (weaponElement == Moverutils.Elements.electricity && skillElement == Moverutils.Elements.water) ||
        (weaponElement == Moverutils.Elements.earth && skillElement == Moverutils.Elements.electricity) ||
        (weaponElement == Moverutils.Elements.wind && skillElement == Moverutils.Elements.earth) ||
        (weaponElement == Moverutils.Elements.fire && skillElement == Moverutils.Elements.wind)
      ) {
        return Math.floor(damage * 0.9);
      }
    }

    return damage;
  }

  /**
   * Returns the magic skill defense.
   */
  applyMagicSkillDefense(attack: number): number {
    if (!this.skill) {
      return 0;
    }

    if (this.attackContext == Moverutils.AttackContext.AC_PVP) {
      attack -= (attack * (this.defender.getExtraParam?.("magicDefense", true) ?? 0)) / 100;
    }

    // Spirit bomb
    if (this.skill.id == 6206) {
      attack *= Math.min(100.0 / 90.0, 1.0) * 2.0; // 100% mana
    }

    const defense = this.computeDefense();
    return this.applyAttackDefense(attack, defense);
  }

  /**
   * Returns the amount of elemental resistance the defender has against the given element.
   */
  getElementResist(element: ElementValue): number {
    switch (element) {
      case Moverutils.Elements.fire:
        return this.defender.resistFire ?? 0;
      case Moverutils.Elements.water:
        return this.defender.resistWater ?? 0;
      case Moverutils.Elements.earth:
        return this.defender.resistEarth ?? 0;
      case Moverutils.Elements.wind:
        return this.defender.resistWind ?? 0;
      case Moverutils.Elements.electricity:
        return this.defender.resistElectricity ?? 0;
      default:
        return 0;
    }
  }

  /**
   * Returns the additional element damage amount.
   */
  getElementDamage(): number {
    let element: ElementValue = Moverutils.Elements.none;
    let attack = 0;

    // TODO: Element upgrade calculations here
    element = Moverutils.getElementValue(this.weapon.element);
    if (element != Moverutils.Elements.none) {
      attack = 16; // API does not include itemProp->elementAttack
    }

    if (element != Moverutils.Elements.none) {
      return Math.floor(attack * (1.0 - this.getElementResist(element)));
    } else {
      return 0;
    }
  }

  /**
   * Returns the damage after application of defense for regular hits.
   */
  applyDefenseParryCritical(attack: number): number {
    let damage: number;

    if (this.skill && (this.skill.id == 5041 || this.skill.id == 7156)) {
      // Asal and HoP ignore defense completely
      damage = attack;
    } else {
      const defense = this.computeDefense();
      damage = this.applyAttackDefense(attack, defense);
    }

    if (damage < 0) {
      damage = 0;
    }

    if (!this.isSkill) {
      const criticalChance = this.getCriticalProbability();

      const criticalFactor = 2.3;
      const criticalBonus = Math.max(0.1, 1.0 + this.attacker.getExtraParam("criticaldamage", true) / 100.0);
      const criticalDamage = Math.floor(criticalFactor * criticalBonus * damage);

      return Math.floor(damage * (1 - criticalChance / 100.0) + criticalDamage * (criticalChance / 100.0));
    }

    return damage;
  }

  /**
   * Returns whether or not
   */
  getCriticalProbability(): number {
    if (this.isSkill) {
      return 0.0;
    }

    const probFactor = 1.0; // Critical resist would factor here
    return Math.floor(this.attacker.getCriticalChance() * probFactor);
  }

  /**
   * Apply the defender defense onto the current attack.
   */
  applyAttackDefense(attack: number, defense: number): number {
    const factor = 2.0;
    let value = 0.0;
    const sum = defense + factor * attack;

    if (defense > 0 && sum > 1.0) {
      value = Math.sqrt(defense / sum);
    }

    const corr = Math.floor(Utils.lerp(defense, attack, value));

    return attack - corr;
  }

  /**
   * Returns the defense of the defender for this current attack.
   */
  computeDefense(): number {
    let defense: number;

    if (this.attackType == Moverutils.AttackType.MAGIC_SKILL) {
      if (this.attackContext == Moverutils.AttackContext.AC_PVE)
        defense = 0; // Magic skills have no defense in PvE
      else defense = this.defender.getExtraParam?.("magicDefense") ?? 0;
    } else if (this.attackType == Moverutils.AttackType.AUTO_ATTACK) {
      defense = this.computeGenericDefense();
    } else if (this.attackType == Moverutils.AttackType.MAGIC_HIT) {
      defense = Math.floor((this.defender.magicDefense ?? 0) / 7.0 + 1);
    } else {
      defense = Math.floor((this.defender.defense ?? 0) / 7.0 + 1);
    }

    const defenseFactor = 1.0;
    // Armor penetrate multiplier would be added here
    // ExtraParam defense rate added here for players

    defense = Math.floor(defense * defenseFactor);
    if (defense < 0) {
      defense = 0;
    }

    return defense;
  }

  /**
   * Return the regular defense for this auto attack.
   */
  computeGenericDefense(): number {
    const jobFactor = 1.0; // Monsters just use a flat 1.0
    const level = this.defender.level ?? 0;
    let equipmentDefense = this.defender.defense ?? 0;
    const stamina = this.defender.sta ?? 0;

    const staFactor = 0.75;
    const levelScale = 2.0 / 2.8;
    const statScale = 0.5 / 2.8;

    let defense = Math.floor(
      level * levelScale + (stamina * statScale + (stamina - 14) * jobFactor) * staFactor - 4
    );
    equipmentDefense /= 4;
    defense += equipmentDefense;
    // players would add flat defense bonuses here

    return defense;
  }

  /**
   * Returns the attack value based on the current attack.
   */
}
