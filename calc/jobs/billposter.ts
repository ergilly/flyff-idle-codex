import { Assist } from "./assist.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Billposter extends Assist {
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
    jobId = jobId || 7424;
    img = img || "lgknuckle.png";
    armor = armor || Utils.getArmorByName("Rody Set");
    mainhand = mainhand || Utils.getItemByName("Legendary Golden Gloves");
    constants = constants || {
      skills: [
        Utils.getSkillByName("Bgvur Tialbold"),
        Utils.getSkillByName("Blood Fist"),
        Utils.getSkillByName("Asalraalaikum")
      ],
      buffs: [Utils.getSkillByName("Asmodeus")],
      attackSpeed: 82.0,
      hps: 2.5,
      HP: 1.8,
      MP: 0.9,
      FP: 1.1,
      Def: 1.4,
      MDefSta: 2.0,
      MDefInt: 2.8,
      block: 0.7,
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
    let health = Math.floor(150 + this.level * 36 + this.sta * this.level * 0.36);
    health *= 1 + this.getExtraParam("maxhp", true) / 100;
    health += this.getExtraParam("maxhp", false);
    return Math.floor(health);
  }

  get fp() {
    let fp = Math.floor(this.level * 2.2 + this.sta * 7.7);
    fp *= 1 + this.getExtraParam("maxfp", true) / 100;
    fp += this.getExtraParam("maxfp", false);
    return fp;
  }

  get mp() {
    let mp = Math.floor(22 + this.level * 1.8 + this.int * 8.1);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
