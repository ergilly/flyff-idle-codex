import { DamageAttackCalculator } from "./attack.js";
import { Utils } from "../utils.js";
import Moverutils from "../moverutils.js";
import type { SkillLevel } from "../types.js";

export class DamageCalculator extends DamageAttackCalculator {
  getStatScale(level: number, levelProp: SkillLevel, isPVP: boolean): number {
    let total = 0;
    const spellContext = isPVP ? Moverutils.AttackContext.AC_PVP : Moverutils.AttackContext.AC_PVE;

    for (const scale of levelProp.scalingParameters) {
      if (scale.parameter == "attack" && scale[spellContext]) {
        let statValue = 0;

        switch (scale.stat) {
          case "int":
            statValue = this.attacker.int;
            break;
          case "sta":
            statValue = this.attacker.sta;
            break;
          case "str":
            statValue = this.attacker.str;
            break;
          case "dex":
            statValue = this.attacker.dex;
            break;
        }

        // TODO: Maximum check
        const realValue = Utils.convertStatScale(scale.scale, level);
        total += (realValue / 10.0) * statValue + (level * statValue) / 50.0;
      }
    }

    return Math.floor(total);
  }

  ///
  /// Damage calculation utilities
  ///

  /**
   * Returns the average damage multiplier at a given chance
   */
  getAverageChanceMultiplier(chance: number, multiplier: number): number {
    return 1 - chance / 100.0 + multiplier * (chance / 100.0);
  }

  /**
   * Returns the damage per second for the current attack.
   */
  getDamagePerSecond(): string {
    let dps = 1;
    let hitsPerSecond = 0;
    const damage = this.computeDamage();

    if (this.attackType == Moverutils.AttackType.AUTO_ATTACK) {
      const hitRate = this.getHitRate();
      const attackSpeed = this.attacker.aspd;
      hitsPerSecond = this.attacker.constants.hps * attackSpeed * (hitRate / 100);
    } else if (this.skill) {
      const skillLevel = this.skill.levels.length;
      const skillLevelProp = this.skill.levels[skillLevel - 1];
      if (!skillLevelProp) return "0";

      const frames = 55.0; // Most skills are around this range
      const cooldown = skillLevelProp.cooldown != undefined ? skillLevelProp.cooldown : 0;
      hitsPerSecond = ((30 / frames) * this.attacker.DCT) / (cooldown + 1);
      // TODO: Damage over time
    }

    dps = damage * hitsPerSecond;
    return dps.toFixed(0);
  }

  /**
   * Returns the number of seconds required to kill the current monster.
   */
  getTimeToKill(): string {
    const damagePerSecond = Number(this.getDamagePerSecond());
    return ((this.defender.hp ?? 0) / damagePerSecond).toFixed(2);
  }
}
