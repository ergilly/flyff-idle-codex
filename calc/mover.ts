import { Utils } from "./utils.js";
import Moverutils from "./moverutils.js";
import { DamageCalculator } from "./damageCalculator.js";
import { MoverState } from "./moverState.js";
import type { DamageTarget, OptimalRatioResult } from "./types.js";

/**
 * The mover class is the base of all characters. Acts as a helper class for a lot of functions.
 */
export abstract class Mover extends MoverState {
  applyData(json: Partial<Mover>): void {
    Object.assign(this, json);
  } // Importing a character

  update(): this {
    this.armorUpgradeBonus = Utils.getUpgradeBonus(this.armorUpgrade);
    this.mainhandUpgradeBonus = Utils.getUpgradeBonus(this.mainhandUpgrade);
    this.offhandUpgradeBonus = Utils.getUpgradeBonus(this.offhandUpgrade);

    this.applyBuffs();
    this.applyPremiumItems();
    this.applyBaseStats();

    this.str = Math.floor(this.str);
    this.sta = Math.floor(this.sta);
    this.dex = Math.floor(this.dex);
    this.int = Math.floor(this.int);

    this.criticalChance = this.getCriticalChance();
    this.aspd = this.getAspd();
    this.DCT = this.getDCT();
    this.attack = this.getAttack();
    this.criticalDamage = this.getCriticalDamage();
    this.hitrate = this.getHitrate();
    this.meleeBlock = this.getBlock();
    this.rangedBlock = this.getBlock(true);

    return this;
  }

  applyBaseStats(): void {
    this.str = 15 + Utils.addedStr + this.getExtraParam("str");
    this.sta = 15 + Utils.addedSta + this.getExtraParam("sta");
    this.dex = 15 + Utils.addedDex + this.getExtraParam("dex");
    this.int = 15 + Utils.addedInt + this.getExtraParam("int");
  }

  applyBuffs(): void {
    // RM/Assist Buffs
    if (this.assistBuffs) {
      for (const buff of Utils.assistBuffs) {
        if (this.activeBuffs.find((b) => b.id == buff.id)) continue;
        buff.enabled = true;
        this.activeBuffs.push(buff);
      }
    } else {
      this.activeBuffs = this.activeBuffs.filter((val) => {
        return !Utils.assistBuffs.find((b) => b.id == val.id);
      });
    }

    // Self Buffs
    if (this.selfBuffs) {
      for (const buff of this.constants.buffs) {
        if (this.activeBuffs.find((b) => b.id == buff.id)) continue;
        if (buff.level > this.level) continue;
        buff.enabled = true;
        this.activeBuffs.push(buff);
      }
    } else {
      this.activeBuffs = this.activeBuffs.filter((val) => {
        return !this.constants.buffs.find((b) => b.id == val.id);
      });
    }

    // Remove any buffs above our level
    this.activeBuffs = this.activeBuffs.filter((val) => {
      return val.level <= this.level || val.class == 9389 || val.class == 8962;
    });
  }

  applyPremiumItems(): void {
    for (const item of Utils.premiumItems) {
      if (item) {
        if (this.activePremiumItems.find((i) => i.id == item.id)) continue;
        item.enabled = false; // disable all items initially
        this.activePremiumItems.push(item);
      }
    }
  }

  get parry(): number {
    return this.dex / 2;
  }

  get defense(): number {
    // TODO: Use computeDefense from DamageCalculator
    let defense = Math.floor(
      (this.level * 2 + this.sta / 2) / 2.8 - 4 + (this.sta - 14) * this.constants.Def
    );
    defense += this.getExtraParam("def");
    defense += this.getEquipmentDefense();
    defense *= 1 + this.getExtraParam("def", true) / 100;
    return Math.floor(defense);
  }

  getBlock(ranged = false): number {
    // CMover::GetBlockFactor
    let extra = this.getExtraParam("block", true);
    if (ranged) {
      extra += this.getExtraParam("rangedblock", true);
    } else {
      extra += this.getExtraParam("meleeblock", true);
    }

    const attackerDex = 15; // Fixed to 15 in the stat window in-game

    const blockB = Utils.clamp(
      Math.floor((this.dex + attackerDex + 2) * ((this.dex - attackerDex) / 800.0)),
      0,
      10
    );
    const blockRate = Math.floor((this.dex / 8.0) * this.constants.block);
    const final = Math.max(blockB + blockRate, 0) + extra;
    return final > 100 ? 100 : final;
  }

  getAspd(): number {
    const weaponAspd = this.mainhand.attackSpeedValue;
    const statScale = 4.0 * this.dex + this.level / 8.0;

    const plusValue = [
      0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.3, 1.38, 1.5
    ];

    const minBaseSpeed = 0.125;
    const maxBaseSpeed = 2.0;
    const baseSpeedScaling = 200.0;

    const baseDividend = baseSpeedScaling * minBaseSpeed;
    const maxBaseScaledSpeed = baseSpeedScaling - baseDividend / maxBaseSpeed;

    const baseSpeed = Math.floor(
      Math.min(this.constants.attackSpeed + weaponAspd * statScale, maxBaseScaledSpeed)
    );

    let speed = baseDividend / (baseSpeedScaling - baseSpeed);

    const plusValueIndex = Math.floor(Utils.clamp(baseSpeed / 10, 0, Math.floor(plusValue.length - 1)));
    speed += plusValue[plusValueIndex];

    const attackSpeed = this.getExtraParam("attackspeed", false) / 1000.0;
    speed += attackSpeed;

    const attackSpeedRate = this.getExtraParam("attackspeed", true);
    if (attackSpeedRate > 0) {
      speed += (attackSpeedRate * 2) / 100;
    }

    speed = Utils.clamp(speed, 0.1, 2.0);
    return speed;
  }

  getCriticalChance(): number {
    let chance = this.dex / 10;
    chance = Math.floor(chance * this.constants.critical);
    chance += this.getExtraParam("criticalchance", true);
    chance = Math.max(chance, 0);

    return chance;
  }

  getDCT(): number {
    let speed = 1.0 + this.getExtraParam("decreasedcastingtime", true) / 100.0;
    speed = Utils.clamp(speed, 0.1, 2.0);
    return speed;
  }

  getAttack(): number {
    const damageCalculator = new DamageCalculator(this, Utils.focus);
    const minMax = damageCalculator.getHitMinMax();

    // Simulate attack bonus from DamageCalculator
    let atkPower = Math.floor((minMax[0] + minMax[1]) / 2);

    // Upcut Stone
    if (this.activePremiumItems.find((buff) => buff.id == 8691 && buff.enabled)) {
      atkPower = Math.floor(atkPower * 1.2);
    }

    const atkPowerRate = this.getExtraParam("attack", true);
    if (atkPowerRate > 0) {
      atkPower += (atkPower * atkPowerRate) / 100;
    }

    atkPower += this.getExtraParam("attack");

    atkPower = Math.floor(atkPower);
    return Math.max(atkPower, 0);
  }

  /**
   * Get the total bonus critical damage %.
   */
  getCriticalDamage(): number {
    let adoch = 0;
    adoch += this.getExtraParam("criticaldamage", true);
    return adoch;
  }

  getHitrate(): number {
    // This is just the value displayed in the stats window, basically not used anywhere else
    let hit = this.dex / 4;
    hit += this.getExtraParam("hitrate", true);
    return Math.max(hit, 0);
  }

  getEquipmentDefense(): number {
    let min = 0;
    let max = 0;

    if (this.offhand && this.offhand.subcategory == "shield") {
      min += this.offhand.minDefense;
      max += this.offhand.maxDefense;

      if (this.offhandUpgradeBonus != null) {
        min *= 1 + this.offhandUpgradeBonus.shieldDefense / 100;
        max *= 1 + this.offhandUpgradeBonus.shieldDefense / 100;

        const upgradeValue = Math.floor(Math.pow(this.offhandUpgradeBonus.upgradeLevel, 1.5));
        min += upgradeValue;
        max += upgradeValue;
      }
    }

    if (this.armor) {
      for (const part of this.armor.parts) {
        const item = Utils.getItemById(part);
        let _min = item.minDefense;
        let _max = item.maxDefense;

        if (this.armorUpgradeBonus != null) {
          _min *= 1 + this.armorUpgradeBonus.suitDefense / 100;
          _max *= 1 + this.armorUpgradeBonus.suitDefense / 100;

          const upgradeValue = Math.floor(Math.pow(this.armorUpgradeBonus.upgradeLevel, 1.5));
          _min += upgradeValue;
          _max += upgradeValue;
        }

        min += _min;
        max += _max;
      }
    }

    const nValue = max - min;
    return min + nValue / 2;
  }

  /**
   * Returns the amount of <param> found in all equipment and all buffs.
   * @param param The parameter to look for in all equipment and buffs
   */
  getExtraParam(param: string, rate = false): number {
    return this.getExtraGearParam(param, rate) + this.getExtraBuffParam(param, rate);
  }

  getExtraBuffParam(param: string, rate = false): number {
    return this.buffParam(param, rate) + this.premiumItemParam(param, rate);
    // return this.assistBuffParam(param, rate) + this.selfBuffParam(param, rate);
  }

  getExtraGearParam(param: string, rate = false): number {
    return this.armorParam(param, rate) + this.weaponParam(param, rate) + this.jeweleryParam(param, rate);
  }

  armorParam(param: string, rate = false): number {
    //var params = [param].concat(Utils.globalParams[param]);
    const params = [param];

    let add = 0;
    if (this.armor && this.armor.bonus) {
      const bonus = this.armor.bonus.find(
        (a) => params.includes(a.ability.parameter) && a.ability.rate == rate
      );
      if (bonus) add = bonus.ability.add;
    }

    // Armor inherent abilities
    if (this.armor) {
      for (const piece of this.armor.parts) {
        const item = Utils.getItemById(piece);
        if (item.abilities != undefined) {
          for (const ability of item.abilities) {
            if (params.includes(ability.parameter) && ability.rate == rate) {
              add += ability.add;
            }
          }
        }
      }
    }

    // Suit Piercing
    if (this.suitPiercing) {
      const ability = this.suitPiercing.abilities?.[0]; // Piercing cards only have one ability
      if (ability && params.includes(ability.parameter) && ability.rate == rate) {
        add += ability.add * 4; // 4 card piercing slots
      }
    }

    // Armor upgrade set effects
    if (this.armorUpgradeBonus != null) {
      const bonus = this.armorUpgradeBonus.setAbilities.find(
        (a) => params.includes(a.parameter) && a.rate == rate
      );
      if (bonus) add += bonus.add;
    }

    return add;
  }

  weaponParam(param: string, rate = false): number {
    let add = 0;
    //var params = [param].concat(Utils.globalParams[param]);
    const params = [param];

    // Mainhand bonus addition
    if (this.mainhand && this.mainhand.abilities) {
      const bonus = this.mainhand.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
      if (bonus) add += bonus.add;
    }

    // Offhand bonus addition, including shields
    if (this.offhand && this.offhand.abilities) {
      if (this.offhand.subcategory == "shield") {
        this.offhand.abilities.forEach((ability) => {
          if (params.includes(ability.parameter) && ability.rate == rate) {
            add += ability.add;
          }
        });
      } else {
        const bonus = this.offhand.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
        if (bonus) add += bonus.add;
      }
    }

    return add;
  }

  jeweleryParam(param: string, rate = false): number {
    let add = 0;
    //var params = [param].concat(Utils.globalParams[param]);
    const params = [param];

    if (this.earringR && this.earringR.abilities) {
      const bonus = this.earringR.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
      if (bonus) add += bonus.add;
    }

    if (this.earringL && this.earringL.abilities) {
      const bonus = this.earringL.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
      if (bonus) add += bonus.add;
    }

    if (this.ringR && this.ringR.abilities) {
      const bonus = this.ringR.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
      if (bonus) add += bonus.add;
    }

    if (this.ringL && this.ringL.abilities) {
      const bonus = this.ringL.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
      if (bonus) add += bonus.add;
    }

    if (this.necklace && this.necklace.abilities) {
      const bonus = this.necklace.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
      if (bonus) add += bonus.add;
    }

    // cloak added here
    if (this.cloak && this.cloak.abilities) {
      const bonus = this.cloak.abilities.find((a) => params.includes(a.parameter) && a.rate == rate);
      if (bonus) add += bonus.add;
    }

    return add;
  }

  /**
   * Returns additions to a specific value from your active & enabled buffs
   * @param param The value to find additions for
   */
  buffParam(param: string, rate = false): number {
    let add = 0;
    //let params = [param].concat(Utils.globalParams[param]);
    const params = [param];

    for (const buff of this.activeBuffs) {
      if (!buff.enabled) continue; // Don't add disabled buffs
      const maxLevel = buff.levels.slice(-1)[0];
      const abilities = maxLevel.abilities;

      for (const ability of abilities) {
        if (params.includes(ability.parameter) && ability.rate == rate) {
          add += ability.add;

          if (maxLevel.scalingParameters != undefined && (buff.class == 9389 || buff.class == 8962)) {
            for (const scaling of maxLevel.scalingParameters) {
              if (params.includes(scaling.parameter)) {
                let extra = scaling.scale * this.assistInt;
                extra = Math.min(extra, scaling.maximum);
                add += extra;
              }
            }
          }
        }
      }
    }

    return add;
  }

  /**
   * Returns additions to a specific value from your active & enabled premium items
   * @param param The value to find additions for
   */
  premiumItemParam(param: string, rate = false): number {
    let add = 0;
    //let params = [param].concat(Utils.globalParams[param]);
    const params = [param];

    for (const premiumItem of this.activePremiumItems) {
      if (!premiumItem.enabled) continue; // Don't add disabled buffs
      const abilities = premiumItem.abilities;

      if (abilities != undefined) {
        for (const ability of abilities) {
          if (params.includes(ability.parameter) && ability.rate == rate) {
            add += ability.add;
          }
        }
      }
    }

    return add;
  }

  /**
   * Returns whether or not the given buff is active.
   */
  hasBuff(buffId: number): boolean {
    const buff = this.activeBuffs.find((b) => b.id == buffId);
    if (buff) {
      return buff.enabled ?? false;
    }

    return false;
  }

  /**
   * Get your damage against a specific monster
   * @param {object} opponent The monster you are facing
   * @param {number} skillIndex The index of the skill you are using, null or -1 if none
   */
  getDamage(opponent: DamageTarget = Moverutils.trainingDummy): void {
    this.update();

    const damageCalculator = new DamageCalculator(this, opponent);
    opponent.playerDamage = damageCalculator.computeDamage();
    opponent.ttk = damageCalculator.getTimeToKill();
    opponent.dps = damageCalculator.getDamagePerSecond();
    opponent.blockFactor = damageCalculator.getBlockFactor().toFixed(3);
    opponent.effectiveHitRate = damageCalculator.getHitRate();
  }

  /**
   * Calculates the best STR:DEX ratio against the given target
   * @param target The targetted monster.
   */
  getOptimalAutoRatio(target: DamageTarget): OptimalRatioResult {
    let dpsValues: number[] = [];
    let ratios: string[] = [];

    // Calculating for at least level 15
    this.level = this.level < 15 ? 15 : this.level;

    this.str -= Utils.addedStr;
    this.sta -= Utils.addedSta;
    this.dex -= Utils.addedDex;
    this.int -= Utils.addedInt;

    let str: number;
    let dex: number;
    let dps: number;
    let ratio: string;
    let maxRatio = 0;
    let maxDPS = -1;
    let damageCalculator;
    const points = this.level * 2 - 2;
    for (let i = 0; i < 10; i++) {
      // Compute the new stats
      str = Math.floor(points * (i / 10));
      dex = points - str;

      this.str += str;
      this.dex += dex;

      this.criticalChance = this.getCriticalChance();
      this.aspd = this.getAspd();
      this.attack = this.getAttack();
      this.hitrate = this.getHitrate();

      // Compute the new damage
      damageCalculator = new DamageCalculator(this, target);
      dps = Number(damageCalculator.getDamagePerSecond());
      ratio = `Allocate ${str} STR, ${dex} DEX`;
      dpsValues = [...dpsValues, dps];
      ratios = [...ratios, ratio];

      if (dps > maxDPS || maxDPS == -1) {
        maxDPS = dps;
        maxRatio = i + 1;
      }

      this.str -= str;
      this.dex -= dex;
    }

    return { maxDPS, maxRatio, dpsValues, ratios };
  }
}
