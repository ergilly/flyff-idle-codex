import { Vagrant } from "./vagrant.js";
import { Utils } from "../utils.js";
import type { ArmorSet, Item, JobConstants, NumericInput } from "../types.js";

export class Mercenary extends Vagrant {
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
    jobId = jobId || 764;
    img = img || "zirkansword.png";
    armor = armor || Utils.getArmorByName("Panggril Set");
    mainhand = mainhand || Utils.getItemByName("Flam Sword");
    constants = constants || {
      skills: [
        Utils.getSkillByName("Shield Bash"),
        Utils.getSkillByName("Keenwheel"),
        Utils.getSkillByName("Guillotine")
      ],
      buffs: [Utils.getSkillByName("Blazing Sword"), Utils.getSkillByName("Sword Mastery")],
      attackSpeed: 77.0,
      hps: 4,
      HP: 1.5,
      MP: 0.5,
      FP: 0.7,
      Def: 1.25,
      MDefSta: 0.75,
      MDefInt: 1.5,
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
    let health = Math.floor(150 + this.level * 30 + this.sta * this.level * 0.3);
    health *= 1 + this.getExtraParam("maxhp", true) / 100;
    health += this.getExtraParam("maxhp", false);
    return Math.floor(health);
  }

  get fp() {
    let fp = Math.floor(this.level * 1.4 + this.sta * 4.9);
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
