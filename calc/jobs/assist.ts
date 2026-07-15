import { Vagrant } from "./vagrant.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Assist extends Vagrant {
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
    jobId = jobId || 8962;
    img = img || "overamknuckle.png";
    armor = armor || Utils.getArmorByName("Talin Set");
    mainhand = mainhand || Utils.getItemByName("Paipol Knuckle");
    constants = constants || {
      skills: [
        Utils.getSkillByName("Power Fist"),
        Utils.getSkillByName("Temping Hole"),
        Utils.getSkillByName("Burst Crack")
      ],
      buffs: [Utils.getSkillByName("Stonehand")],
      attackSpeed: 72.0,
      HP: 1.4,
      hps: 4,
      MP: 1.3,
      FP: 0.6,
      Def: 1.2,
      MDefSta: 1.3,
      MDefInt: 2.3,
      block: 0.5,
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
    let health = Math.floor(150 + this.level * 28 + this.sta * this.level * 0.28);
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
    let mp = Math.floor(22 + this.level * 2.6 + this.int * 11.7);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
