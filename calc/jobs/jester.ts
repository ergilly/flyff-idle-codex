import { Acrobat } from "./acrobat.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Jester extends Acrobat {
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
    jobId = jobId || 3545;
    img = img || "lgyoyo.png";
    armor = armor || Utils.getArmorByName("Neis Set");
    mainhand = mainhand || Utils.getItemByName("Legendary Golden Yo-Yo");
    constants = constants || {
      skills: [
        Utils.getSkillByName("Multi-Stab"),
        Utils.getSkillByName("Vital stab"),
        Utils.getSkillByName("Hit of Penya")
      ],
      buffs: [
        Utils.getSkillByName("Critical Swing"),
        Utils.getSkillByName("Enchant Absorb"),
        Utils.getSkillByName("Yo-Yo Mastery"),
        Utils.getSkillByName("Bow Mastery")
      ],
      attackSpeed: 82.0,
      hps: 2.6,
      HP: 1.5,
      MP: 0.5,
      FP: 1.0,
      Def: 1.4,
      MDefSta: 1.3,
      MDefInt: 2.3,
      block: 0.8,
      critical: 4.0,
      sword: 4.5,
      axe: 5.5,
      staff: 0.8,
      stick: 3.0,
      knuckle: 5.0,
      wand: 6.0,
      yoyo: 5.0,
      bow: 2.0
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
    let fp = Math.floor(this.level * 2 + this.sta * 7);
    fp *= 1 + this.getExtraParam("maxfp", true) / 100;
    fp += this.getExtraParam("maxfp", false);
    return fp;
  }

  get mp() {
    let mp = Math.floor(22 + this.level * 1 + this.int * 4.5);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
