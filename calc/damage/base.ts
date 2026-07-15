import Moverutils from "../moverutils.js";
import { Psykeeper } from "../jobs.js";
import type { Mover } from "../mover.js";
import type { DamageTarget, Item, Skill, SkillLevel } from "../types.js";

export abstract class DamageCalculatorBase {
  attacker: Mover;
  defender: DamageTarget;
  weapon: Item;
  skill: Skill | null;
  isSkill: boolean;
  damage: number;
  attackContext: (typeof Moverutils.AttackContext)[keyof typeof Moverutils.AttackContext];
  attackType: (typeof Moverutils.AttackType)[keyof typeof Moverutils.AttackType];
  defenseFactor: number;

  abstract applyDefense(attack: number): number;
  abstract computeAttack(): number;
  abstract computeAsalraalaikumDamage(): number;
  abstract getAverageChanceMultiplier(chance: number, multiplier: number): number;
  abstract getStatScale(level: number, levelProperty: SkillLevel, isPvp: boolean): number;

  constructor(attacker: Mover, defender: DamageTarget) {
    this.attacker = attacker;
    this.defender = defender;
    this.weapon = attacker.mainhand;
    this.skill = attacker.focusSkill == -1 ? null : attacker.focusSkill;
    this.isSkill = this.skill != null; // Using a skill or not
    this.damage = 0;
    this.attackContext = Moverutils.AttackContext.AC_PVE;
    this.attackType = this.getAttackType();
    this.defenseFactor = 0;

    this.damage = -1;
  }

  /**
   * Returns the current attack type.
   */
  getAttackType(): (typeof Moverutils.AttackType)[keyof typeof Moverutils.AttackType] {
    if (this.skill) {
      if (this.skill.magic == false) {
        return Moverutils.AttackType.MELEE_SKILL;
      } else {
        return Moverutils.AttackType.MAGIC_SKILL;
      }
    } else if (this.attacker instanceof Psykeeper) {
      return Moverutils.AttackType.MAGIC_HIT;
    }

    return Moverutils.AttackType.AUTO_ATTACK;
  }

  /**
   * Returns the final damage of the current attack.
   */
  computeDamage(): number {
    if (this.damage > -1) {
      return this.damage;
    }

    const attack = this.computeAttack();
    const damage = this.applyDefense(attack);

    this.damage = damage;
    return damage;
  }

  /**
   * Returns the damage after the application of defense.
   */
}
