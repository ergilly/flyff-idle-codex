import { Vagrant } from "./vagrant.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Magician extends Vagrant {
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
    jobId = jobId || 9581;
    img = img || "opelwand.png";
    armor = armor || Utils.getArmorByName("Teba Set");
    mainhand = mainhand || Utils.getItemByName("Opel Wand");
    constants = constants || {
      skills: [
        Utils.getSkillById(4729), // Mental strike, there is 2 so using ID for this one
        Utils.getSkillByName("Rock Crash"),
        Utils.getSkillByName("Water Well")
      ],
      buffs: [],
      attackSpeed: 62.0,
      hps: 1,
      HP: 1.4,
      MP: 1.7,
      FP: 0.3,
      Def: 1.15,
      MDefSta: 3.0,
      MDefInt: 4.2,
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
    let fp = Math.floor(this.level * 0.6 + this.sta * 2.1);
    fp *= 1 + this.getExtraParam("maxfp", true) / 100;
    fp += this.getExtraParam("maxfp", false);
    return fp;
  }

  get mp() {
    let mp = Math.floor(22 + this.level * 3.4 + this.int * 15.3);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
