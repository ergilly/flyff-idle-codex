import { Acrobat } from "./acrobat.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Ranger extends Acrobat {
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
    jobId = jobId || 9295;
    img = img || "lgbow.png";
    armor = armor || Utils.getArmorByName("Tyrent Set");
    mainhand = mainhand || Utils.getItemByName("Legendary Golden Bow");
    constants = constants || {
      skills: [
        Utils.getSkillByName("Ice Arrow"),
        Utils.getSkillByName("Flame Arrow"),
        Utils.getSkillByName("Silent Arrow")
      ],
      buffs: [
        Utils.getSkillByName("Critical Shot"),
        Utils.getSkillByName("Nature"),
        Utils.getSkillByName("Yo-Yo Mastery"),
        Utils.getSkillByName("Bow Mastery")
      ],
      attackSpeed: 77.0,
      hps: 1.5,
      HP: 1.6,
      MP: 1.2,
      FP: 0.6,
      Def: 1.4,
      MDefSta: 2.0,
      MDefInt: 3.0,
      block: 0.8,
      critical: 2.0,
      sword: 4.5,
      axe: 5.5,
      staff: 0.8,
      stick: 3.0,
      knuckle: 5.0,
      wand: 6.0,
      yoyo: 2.0,
      bow: 4.0
    };
    super(str, sta, int, dex, level, constants, img, mainhand, offhand, armor, jobId);
  }

  get health() {
    let health = Math.floor(150 + this.level * 32 + this.sta * this.level * 0.32);
    health *= 1 + this.getExtraParam("maxhp", true) / 100;
    health += this.getExtraParam("maxhp", false);
    return Math.floor(health);
  }

  get fp() {
    let fp = Math.floor(this.level * 1.2 + this.sta * 4.2);
    fp *= 1 + this.getExtraParam("maxfp", true) / 100;
    fp += this.getExtraParam("maxfp", false);
    return fp;
  }

  get mp() {
    let mp = Math.floor(22 + this.level * 2.4 + this.int * 10.8);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
