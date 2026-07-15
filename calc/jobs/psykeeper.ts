import { Magician } from "./magician.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Psykeeper extends Magician {
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
    jobId = jobId || 5709;
    img = img || "lgwand.png";
    armor = armor || Utils.getArmorByName("Mekatro Set");
    mainhand = mainhand || Utils.getItemByName("Legendary Golden Wand");
    constants = constants || {
      skills: [
        Utils.getSkillByName("Psychic Bomb"),
        Utils.getSkillByName("Spirit Bomb"),
        Utils.getSkillByName("Psychic Square")
      ],
      buffs: [],
      attackSpeed: 67.0,
      hps: 1,
      HP: 1.5,
      MP: 2.0,
      FP: 0.4,
      Def: 1.2,
      MDefSta: 3.0,
      MDefInt: 4.2,
      block: 0.3,
      critical: 1.0,
      sword: 4.5,
      axe: 5.5,
      staff: 0.8,
      stick: 3.0,
      knuckle: 5.0,
      wand: 5.5,
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
    let fp = Math.floor(this.level * 0.8 + this.sta * 2.8);
    fp *= 1 + this.getExtraParam("maxfp", true) / 100;
    fp += this.getExtraParam("maxfp", false);
    return fp;
  }

  get mp() {
    let mp = Math.floor(22 + this.level * 4 + this.int * 18);
    mp *= 1 + this.getExtraParam("maxmp", true) / 100;
    mp += this.getExtraParam("maxmp", false);
    return mp;
  }
}
