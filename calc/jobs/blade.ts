import { Mercenary } from "./mercenary.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Blade extends Mercenary {
  constructor(
    str: NumericInput = 15,
    sta: NumericInput = 15,
    int: NumericInput = 15,
    dex: NumericInput = 15,
    level: NumericInput = 1,
    constants: JobConstants | null = null,
    img: string | null = null,
    mainhand: Item | null = null,
    offhand: Item | null = null,
    armor: ArmorSet | null = null,
    jobId: number | null = null
  ) {
    jobId = jobId || 2246;
    img = img || "lgaxe.png";
    armor = armor || Utils.getArmorByName("Hanes Set");
    mainhand = mainhand || Utils.getItemByName("Legendary Golden Axe");
    offhand = offhand || Utils.getItemByName("Legendary Golden Axe");
    constants = constants || {
      skills: [
        Utils.getSkillByName("Blade Dance"),
        Utils.getSkillByName("Hawk Attack"),
        Utils.getSkillByName("Cross Strike")
      ],
      buffs: [
        Utils.getSkillByName("Berserk"),
        Utils.getSkillByName("Smite Axe"),
        Utils.getSkillByName("Axe Mastery"),
        Utils.getSkillByName("Sword Mastery")
      ],
      attackSpeed: 87.0,
      hps: 3,
      HP: 1.5,
      MP: 0.6,
      FP: 1.2,
      Def: 1.45,
      MDefSta: 1.3,
      MDefInt: 2.3,
      block: 1.5,
      critical: 1.0,
      sword: 4.5,
      axe: 5.5,
      staff: 0.8,
      stick: 3.0,
      knuckle: 5.0,
      wand: 6.0,
      yoyo: 4.2
    };
    super(str, sta, int, dex, level, constants, img, mainhand, offhand, armor, jobId);
  }

  get health() {
    let health = Math.floor(150 + this.level * 30 + this.sta * this.level * 0.3);
    health *= 1 + this.getExtraParam("maxhp", true) / 100;
    health += this.getExtraParam("maxhp", false);
    return Math.floor(health);
  }

  get fp() {
    let fp = Math.floor(this.level * 2.4 + this.sta * 8.400001);
    fp *= 1 + this.getExtraParam("maxfp", true) / 100;
    fp += this.getExtraParam("maxfp", false);
    return fp;
  }

  get mp() {
    let mp = Math.floor(22 + this.level * 1.2 + this.int * 5.4);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
